
import React, { useState, useEffect } from 'react';
import { sheetsService, cleanPhone } from '../services/sheetsService.ts';
import { generateSmartReply } from '../services/geminiService.ts';
import { Client, Product } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { useNotify } from '../App.tsx';

const STATUS_MAP: Record<string, { color: string, border: string, bg: string }> = {
  'New': { color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
  'Pending': { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  'Confirmed': { color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  'Delivered': { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Cancelled': { color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' }
};

const Clients: React.FC = () => {
  const { notify } = useNotify();
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [globalLang] = useState(localStorage.getItem('zenith_lang') || 'Moroccan Darija');
  
  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    client: '', phone: '', city: '', address: '', items: '', qty: 1, price: 0, statuses: 'New', note: '', date: new Date().toLocaleDateString()
  });

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    const data = await sheetsService.fetchData('Clients');
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAiChat = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setActiveClient(client);
    setChatHistory([{ role: 'ai', text: `Agent ready for ${client.client} (${globalLang} Protocol). Context: ${client.items} (${client.price} MAD).` }]);
    setIsAiModalOpen(true);
  };

  const handleOpenEntry = (client?: Client) => {
    if (client) {
      setFormData({ ...client });
      setEditingId(client.phone?.toString());
    } else {
      setFormData({ client: '', phone: '', city: '', address: '', items: '', qty: 1, price: 0, statuses: 'New', note: '', date: new Date().toLocaleDateString() });
      setEditingId(null);
    }
    setIsEntryModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const clientToSave = { ...formData, phone: cleanPhone(formData.phone || '') } as Client;
    try {
      if (editingId) await sheetsService.updateData('Clients', clientToSave, 'phone', editingId);
      else await sheetsService.createData('Clients', clientToSave);
      
      notify(editingId ? "Profile updated." : "New lead synchronized.");
      await loadClients();
      setIsEntryModalOpen(false);
    } catch (err) {
      notify("Synchronization failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (phone: string) => {
    if (!window.confirm('Erase this record from neural database?')) return;
    setLoading(true);
    try {
      await sheetsService.deleteData('Clients', 'phone', phone.toString());
      notify("Record deleted successfully.");
      await loadClients();
      setIsDetailModalOpen(false);
    } catch (e) {
      notify("Deletion failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if(!userInput || !activeClient || isAiThinking) return;
    const m = userInput; 
    setUserInput('');
    setChatHistory(p => [...p, {role:'user', text:m}]);
    setIsAiThinking(true);
    
    try {
      const r = await generateSmartReply(m, `Client: ${activeClient.client}, Order: ${activeClient.items}, Price: ${activeClient.price}`, globalLang);
      setChatHistory(p => [...p, {role:'ai', text:r}]);
    } catch (e) {
      notify("AI interaction failed.", "error");
    } finally {
      setIsAiThinking(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const s = search.toLowerCase();
    const matchesSearch = (c.client || '').toLowerCase().includes(s) || (c.phone || '').toString().includes(s);
    const matchesFilter = activeFilter === 'All' || c.statuses === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* COMPACT CONTROL BAR */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-2xl">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500 transition-all" 
            />
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['All', 'New', 'Pending', 'Confirmed'].map(f => (
              <button 
                key={f} 
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mr-2">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}><ICONS.Dashboard className="w-3.5 h-3.5" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}><ICONS.Integrations className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => handleOpenEntry()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
            <ICONS.Plus className="w-3 h-3" /> Add Lead
          </button>
        </div>
      </div>

      {loading && clients.length === 0 ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredClients.map((client, idx) => {
            const st = STATUS_MAP[client.statuses] || { color: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-800/10' };
            return (
              <div 
                key={idx} 
                onClick={() => { setActiveClient(client); setIsDetailModalOpen(true); }}
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between h-[160px] animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-700/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {client.client.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-[11px] truncate text-slate-200">{client.client}</h4>
                      <p className="text-[9px] font-mono text-slate-500">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleAiChat(e, client)} className="p-1.5 hover:bg-indigo-600 rounded-md text-indigo-400 hover:text-white transition-colors">
                      <ICONS.Sparkles className="w-3 h-3" />
                    </button>
                    <a href={`https://wa.me/${cleanPhone(client.phone)}`} target="_blank" onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-emerald-600 rounded-md text-emerald-400 hover:text-white transition-colors">
                      <ICONS.WhatsApp className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/50 mt-auto">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Order Detail</p>
                  <p className="text-[10px] text-slate-400 truncate font-bold italic">"{client.items || 'N/A'}"</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] font-black text-indigo-400">{client.price} <span className="text-[8px] opacity-40">MAD</span></span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${st.border} ${st.bg} ${st.color} tracking-widest`}>
                    {client.statuses}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-900/50 text-slate-500 uppercase font-black tracking-[0.2em] border-b border-slate-800">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Product Flow</th>
                  <th className="px-6 py-4">Rev.</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4 text-center">Lifecycle</th>
                  <th className="px-6 py-4 text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredClients.map((c, i) => {
                  const st = STATUS_MAP[c.statuses] || { color: 'text-slate-400' };
                  return (
                    <tr key={i} onClick={() => { setActiveClient(c); setIsDetailModalOpen(true); }} className="hover:bg-indigo-600/5 transition-all cursor-pointer group">
                      <td className="px-6 py-3 font-bold text-slate-200">{c.client}</td>
                      <td className="px-6 py-3 font-mono text-slate-500">{c.phone}</td>
                      <td className="px-6 py-3 text-slate-400 italic truncate max-w-[180px]">{c.items}</td>
                      <td className="px-6 py-3 font-bold text-indigo-400">{c.price}</td>
                      <td className="px-6 py-3 text-slate-500 uppercase font-black tracking-widest">{c.city}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`flex items-center justify-center gap-2 ${st.color} font-black uppercase tracking-widest text-[9px]`}>
                          <div className={`w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]`}></div>
                          {c.statuses}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={(e) => handleAiChat(e, c)} className="text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors">✨ Sentry</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && activeClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-3xl glass-panel rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col md:flex-row h-[550px]">
              <div className="w-full md:w-1/3 bg-indigo-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-white/10 blur-[50px] rounded-full"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-3xl font-black mb-6 shadow-inner">{activeClient.client.charAt(0)}</div>
                  <h3 className="text-2xl font-black tracking-tight">{activeClient.client}</h3>
                  <p className="text-indigo-200 font-mono text-sm opacity-80">{activeClient.phone}</p>
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black uppercase text-indigo-200 mb-1 tracking-widest">Geolocation</p>
                    <p className="text-sm font-bold">{activeClient.city || 'Undetected'}</p>
                  </div>
                  <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-4 bg-slate-950 hover:bg-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all">Dismiss</button>
                </div>
              </div>
              <div className="flex-1 p-10 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center pb-6 border-b border-slate-800">
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Lifecycle Dossier</h4>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsDetailModalOpen(false); handleOpenEntry(activeClient); }} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">📝</button>
                    <button onClick={(e) => { setIsDetailModalOpen(false); handleAiChat(e, activeClient); }} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">✨ Neural Agent</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Revenue Forecast</p>
                    <p className="text-xl font-black text-indigo-400">{activeClient.price} <span className="text-xs opacity-50">MAD</span></p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Registry Date</p>
                    <p className="text-sm font-bold text-slate-300">{activeClient.date}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Endpoint Destination</p>
                  <p className="text-xs text-slate-400 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 leading-relaxed italic">"{activeClient.address || 'Missing address data.'}"</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Strategic Notes</p>
                  <p className="text-xs text-slate-500 bg-slate-950 p-4 rounded-2xl border border-slate-800/50 leading-relaxed italic">"{activeClient.note || 'No intelligence notes recorded.'}"</p>
                </div>
                <div className="pt-6 border-t border-slate-800 flex justify-end">
                   <button onClick={() => handleDeleteClient(activeClient.phone)} className="text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest hover:underline">Erase Profile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI AGENT OVERLAY */}
      {isAiModalOpen && activeClient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="w-full max-w-xl glass-panel rounded-[2.5rem] border border-slate-800 overflow-hidden flex flex-col h-[70vh] shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-lg">🤖</span>
                <p className="text-white font-black text-[10px] uppercase tracking-widest">Neural Agent / {activeClient.client} / {globalLang}</p>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/40 custom-scrollbar">
              {chatHistory.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] leading-relaxed shadow-lg ${chat.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start">
                   <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700">
                      <div className="flex gap-1">
                         <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                         <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      </div>
                   </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input 
                value={userInput} 
                onChange={e => setUserInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message..." 
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none" 
              />
              <button 
                onClick={handleSendMessage}
                disabled={isAiThinking}
                className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                <ICONS.Sparkles className="w-4 h-4 text-white"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENTRY FORM MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="w-full max-w-xl glass-panel p-10 rounded-[3rem] border border-slate-800 animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 italic">{editingId ? 'Modify' : 'Initiate'} Record</h3>
            <form onSubmit={handleSaveClient} className="grid grid-cols-2 gap-5">
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
                <input required className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 outline-none" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">WhatsApp Identity</label>
                <input required className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-mono focus:border-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Operational Status</label>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-black uppercase tracking-widest focus:border-indigo-500 outline-none appearance-none" value={formData.statuses} onChange={e => setFormData({...formData, statuses: e.target.value})}>
                  <option>New</option><option>Pending</option><option>Confirmed</option><option>Delivered</option><option>Cancelled</option>
                </select>
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Target City</label>
                <input className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-bold uppercase" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Product Configuration</label>
                <input className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-medium italic" value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} placeholder="e.g. Galaxy Ultra S24" />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Net Revenue (MAD)</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-black text-indigo-400" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Qty</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Physical Logistics Address</label>
                <input className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="col-span-2 flex gap-4 pt-6">
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingId ? 'Update Neural Record' : 'Synchronize Lead')}
                </button>
                <button type="button" onClick={() => setIsEntryModalOpen(false)} className="px-8 py-5 bg-slate-800 hover:bg-slate-700 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest text-slate-400">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
