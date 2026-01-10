
import React, { useState, useEffect, useMemo } from 'react';
import { sheetsService } from '../services/sheetsService.ts';
import { KeyRecord } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { useNotify } from '../App.tsx';

const Integrations: React.FC = () => {
  const { notify } = useNotify();
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyForm, setKeyForm] = useState({ key: '', value: '' });

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    setLoading(true);
    const data = await sheetsService.fetchData('Keys');
    setKeys(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const health = useMemo(() => {
    return {
      token: keys.some(k => k.key.toLowerCase().trim() === 'whatsapp_access_token'),
      phone: keys.some(k => k.key.toLowerCase().trim() === 'whatsapp_phone_id' || k.key.toLowerCase().trim().startsWith('whatsapp_node_')),
      webhook: keys.some(k => k.key.toLowerCase().trim() === 'webhook_verify_token'),
      ai: keys.some(k => k.key.toLowerCase().trim() === 'gemini_api_key' || k.key.toLowerCase().trim() === 'openai_api_key')
    };
  }, [keys]);

  const testMetaLink = async () => {
    setTesting(true);
    const rawToken = keys.find(k => k.key.toLowerCase().trim() === 'whatsapp_access_token')?.value;
    const rawPhoneId = keys.find(k => k.key.toLowerCase().trim() === 'whatsapp_phone_id')?.value;
    
    const token = rawToken ? String(rawToken).trim() : '';
    const phoneId = rawPhoneId ? String(rawPhoneId).trim() : '';
    
    if (!token || !phoneId) {
      notify("Missing basic Meta info to test.", "error");
      setTesting(false);
      return;
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?access_token=${token}`);
      const data = await res.json();
      if (res.ok) notify(`Meta Handshake OK: Verified Phone ID ${phoneId}`, "success");
      else notify(`Meta Rejection: ${data.error?.message}`, "error");
    } catch (e) {
      notify("Link timeout or CORS issue.", "error");
    }
    setTesting(false);
  };

  const handleOpenModal = (record?: KeyRecord) => {
    if (record) { setKeyForm({ key: record.key, value: record.value }); setEditingKey(record.key); }
    else { setKeyForm({ key: '', value: '' }); setEditingKey(null); }
    setIsModalOpen(true);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { key: keyForm.key.toLowerCase().trim(), value: keyForm.value.trim() };
    if (editingKey) await sheetsService.updateData('Keys', payload, 'key', editingKey);
    else await sheetsService.createData('Keys', payload);
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

  return (
    <div className="space-y-12">
      <div className="glass-panel p-12 rounded-[4rem] border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden animate-in slide-in-from-top-4 duration-700">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
         <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 space-y-6">
               <div className="inline-block px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Meta API Control</div>
               <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">The Neural Connection</h2>
               <div className="flex flex-wrap gap-4">
                  <button onClick={testMetaLink} disabled={testing} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    {testing ? 'Testing...' : 'Test Meta Link'}
                  </button>
               </div>
            </div>
            <div className="md:w-1/2 bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
               <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Credential Health</p>
                  <button onClick={loadKeys} className="text-[10px] font-black uppercase text-indigo-400 hover:underline">Refresh</button>
               </div>
               <div className="space-y-6">
                  {Object.entries(health).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                       <span className="text-[11px] font-bold text-slate-300 uppercase">{k.replace('_', ' ')}</span>
                       <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'}`}>
                          {v ? 'SYNCED' : 'MISSING'}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="glass-panel p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tighter italic">System Credentials</h3>
          <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20">
            Add New Key
          </button>
        </div>

        <div className="space-y-4">
          {keys.map((k) => (
            <div key={k.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-950/40 border border-slate-800 rounded-[2rem] gap-4 hover:border-indigo-500/30 transition-all group">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{k.key}</p>
                <p className="font-mono text-slate-400 text-sm truncate">{k.value ? '••••••••••••••••••••••••••••' : 'EMPTY'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(k)} className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Update</button>
                <button onClick={() => handleDeleteKey(k.key)} className="px-4 py-2 bg-slate-800 hover:bg-red-600 text-white text-[10px] font-black uppercase rounded-xl">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full max-md glass-panel p-8 rounded-[3rem] border border-slate-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 italic">Configure System Key</h3>
            <form onSubmit={handleSaveKey} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Variable Name</label>
                <input required disabled={!!editingKey} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-mono font-bold" value={keyForm.key} onChange={e => setKeyForm({...keyForm, key: e.target.value.toLowerCase().trim()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Secret Value</label>
                <input required className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-mono font-bold" value={keyForm.value} onChange={e => setKeyForm({...keyForm, value: e.target.value.trim()})} />
              </div>
              <div className="pt-6 flex gap-4">
                <button disabled={loading} type="submit" className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase transition-all">
                  {loading ? '...' : 'Sync Key'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-800 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
