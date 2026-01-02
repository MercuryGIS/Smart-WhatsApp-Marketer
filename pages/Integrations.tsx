
import React, { useState, useEffect } from 'react';
import { sheetsService } from '../services/sheetsService.ts';
import { KeyRecord } from '../types.ts';
import { ICONS } from '../constants.tsx';

const Integrations: React.FC = () => {
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Key Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyForm, setKeyForm] = useState({ key: '', value: '' });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    const data = await sheetsService.fetchData('Keys');
    setKeys(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleOpenModal = (record?: KeyRecord) => {
    if (record) {
      setKeyForm(record);
      setEditingKey(record.key);
    } else {
      setKeyForm({ key: '', value: '' });
      setEditingKey(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingKey) {
      await sheetsService.updateData('Keys', keyForm, 'key', editingKey);
    } else {
      await sheetsService.createData('Keys', keyForm);
    }
    await loadKeys();
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDeleteKey = async (keyName: string) => {
    if (!window.confirm(`Permanently remove key: ${keyName}?`)) return;
    setLoading(true);
    await sheetsService.deleteData('Keys', 'key', keyName);
    await loadKeys();
    setLoading(false);
  };

  const IntegrationCard = ({ name, icon, status, desc }: any) => (
    <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group border border-slate-800">
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-3xl shadow-inner border border-slate-700">
          {icon}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase ${status === 'Connected' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          {status}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">{desc}</p>
      <button className="w-full py-4 rounded-2xl bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
        <ICONS.Settings className="w-4 h-4" /> Configure API
      </button>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <IntegrationCard name="Meta WhatsApp API" icon="📱" status="Connected" desc="Cloud infrastructure for high-volume automated messaging." />
        <IntegrationCard name="Google Gemini" icon="✨" status="Connected" desc="Neural engine driving marketing and sales automation." />
        <IntegrationCard name="Google Sheets" icon="📊" status="Connected" desc="Unified backend database for real-time synchronization." />
      </div>

      <div className="glass-panel p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">System Credentials</h3>
            <p className="text-slate-500 text-sm font-medium">Manage API keys and environment variables</p>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-600/20">
            <ICONS.Plus className="w-4 h-4" /> Add New Key
          </button>
        </div>

        {loading && keys.length === 0 && <div className="text-indigo-400 text-sm font-black mb-4 animate-pulse uppercase tracking-widest">Synchronizing Keys...</div>}
        
        <div className="space-y-4">
          {keys.map((k) => (
            <div key={k.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-950/40 border border-slate-800 rounded-[2rem] gap-4 hover:border-indigo-500/30 transition-all group">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{k.key}</p>
                <p className="font-mono text-slate-400 text-sm truncate">{k.value ? '••••••••••••••••••••••••••••' : 'NO VALUE DETECTED'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(k)} className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Update</button>
                <button onClick={() => handleDeleteKey(k.key)} className="px-4 py-2 bg-slate-800 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all opacity-0 group-hover:opacity-100">Delete</button>
              </div>
            </div>
          ))}
          {keys.length === 0 && !loading && (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-[2rem]">
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">No keys found in 'Keys' sheet</p>
            </div>
          )}
        </div>
      </div>

      {/* KEY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-8 rounded-[3rem] border border-slate-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">{editingKey ? 'Update Key' : 'Add System Key'}</h3>
            <form onSubmit={handleSaveKey} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Variable Name (ID)</label>
                <input required disabled={!!editingKey} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-mono font-bold disabled:opacity-50" value={keyForm.key} onChange={e => setKeyForm({...keyForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})} placeholder="e.g. meta_api_key" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Secret Value</label>
                <input required className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-mono font-bold" value={keyForm.value} onChange={e => setKeyForm({...keyForm, value: e.target.value})} placeholder="Paste key here..." />
              </div>
              <div className="pt-6 flex gap-4">
                <button disabled={loading} type="submit" className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all">
                  {loading ? 'Processing...' : (editingKey ? 'Sync Update' : 'Store Key')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
