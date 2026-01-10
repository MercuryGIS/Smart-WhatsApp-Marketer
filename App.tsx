
import React, { useState, useEffect, createContext, useContext } from 'react';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import WhatsAppHub from './pages/WhatsAppHub.tsx';
import Clients from './pages/Clients.tsx';
import Team from './pages/Team.tsx';
import Integrations from './pages/Integrations.tsx';
import Settings from './pages/Settings.tsx';
import { sheetsService } from './services/sheetsService.ts';
import { ICONS } from './constants.tsx';

// Global Notification Context
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' };
const ToastContext = createContext({
  notify: (message: string, type: 'success' | 'error' | 'info' = 'success') => {}
});
export const useNotify = () => useContext(ToastContext);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [bridgeUrl, setBridgeUrl] = useState(localStorage.getItem('zenith_script_url') || '');
  const [loading, setLoading] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const appsScriptCode = `/**
 * WhatsAi Agent CRM - Backend v12.4 (META WEBHOOK CATEGORY PRO)
 * Optimized for real-time KPIs: Sent, Opened, Replied.
 */

function doGet(e) {
  if (e.parameter['hub.mode'] === 'subscribe' && e.parameter['hub.challenge']) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const keySheet = ss.getSheetByName('Keys');
    let savedToken = "";
    if (keySheet) {
      const keys = getRowsData(keySheet);
      const record = keys.find(k => {
        const kName = Object.keys(k).find(key => key.toLowerCase() === 'key');
        return k[kName] === 'webhook_verify_token';
      });
      if (record) savedToken = record[Object.keys(record).find(key => key.toLowerCase() === 'value')];
    }
    if (e.parameter['hub.verify_token'] === savedToken && savedToken !== "") {
      return ContentService.createTextOutput(e.parameter['hub.challenge']).setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput("Token Mismatch").setMimeType(ContentService.MimeType.TEXT);
  }

  const sheetName = e.parameter.sheet;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet '" + sheetName + "' not found" });
  const data = getRowsData(sheet);
  return createJsonResponse({ success: true, data: data });
}

function doPost(e) {
  try {
    const postBody = e.postData.contents;
    const req = JSON.parse(postBody);

    if (req.object === 'whatsapp_business_account') {
      processMetaWebhook(req);
      return createJsonResponse({ success: true, message: "Webhook Processed" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(req.sheet);
    if (!sheet) return createJsonResponse({ success: false, error: "Sheet '" + req.sheet + "' not found" });
    
    const range = sheet.getDataRange();
    const data = range.getValues();
    const headers = data[0];

    if (req.action === 'create') {
      const newRow = headers.map(h => {
        const payloadKey = Object.keys(req.data).find(k => k.toLowerCase().replace(/\\s+/g, '') === h.toLowerCase().replace(/\\s+/g, ''));
        return payloadKey !== undefined ? req.data[payloadKey] : "";
      });
      sheet.appendRow(newRow);
      return createJsonResponse({ success: true, message: "Created" });
    }

    if (req.action === 'update' || req.action === 'delete') {
      const idIdx = headers.findIndex(h => h.toLowerCase().replace(/\\s+/g, '') === req.idKey.toLowerCase().replace(/\\s+/g, ''));
      const targetVal = req.idValue.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (let i = 1; i < data.length; i++) {
        const rowFuzzy = data[i][idIdx].toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rowFuzzy === targetVal || (rowFuzzy.slice(-9) === targetVal.slice(-9) && rowFuzzy.length >= 9)) {
          if (req.action === 'delete') {
            sheet.deleteRow(i + 1);
            return createJsonResponse({ success: true, message: "Deleted" });
          } else {
            const existingRow = data[i];
            const updatedRow = headers.map((h, hIdx) => {
              const payloadKey = Object.keys(req.data).find(k => k.toLowerCase().replace(/\\s+/g, '') === h.toLowerCase().replace(/\\s+/g, ''));
              return payloadKey !== undefined ? req.data[payloadKey] : existingRow[hIdx];
            });
            sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
            return createJsonResponse({ success: true, message: "Updated" });
          }
        }
      }
    }
  } catch (err) { return createJsonResponse({ success: false, error: err.toString() }); }
}

function processMetaWebhook(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const campaignSheet = ss.getSheetByName('Campaigns');
  const clientSheet = ss.getSheetByName('Clients');
  if (!campaignSheet) return;
  
  const entries = payload.entry;
  entries.forEach(entry => {
    const changes = entry.changes;
    changes.forEach(change => {
      const value = change.value;
      if (value.statuses) {
        value.statuses.forEach(status => {
          if (status.status === 'read' || status.status === 'delivered') {
            incrementCampaignStat(campaignSheet, status.status === 'read' ? 'opened' : 'sent');
          }
        });
      }
      if (value.messages) {
        incrementCampaignStat(campaignSheet, 'replied');
        value.messages.forEach(msg => {
          updateClientLastInteraction(clientSheet, msg.from, msg.text ? msg.text.body : 'Media Message');
        });
      }
    });
  });
}

function incrementCampaignStat(sheet, columnKey) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.findIndex(h => h.toLowerCase().includes(columnKey.toLowerCase()));
  if (colIdx === -1) return;
  const lastRowIdx = data.length;
  if (lastRowIdx > 1) {
    const cell = sheet.getRange(lastRowIdx, colIdx + 1);
    const currentVal = Number(cell.getValue()) || 0;
    cell.setValue(currentVal + 1);
  }
}

function updateClientLastInteraction(sheet, phone, snippet) {
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
  const noteIdx = headers.findIndex(h => h.toLowerCase().includes('note'));
  if (phoneIdx === -1) return;
  
  const target = phone.replace(/\\D/g, '');
  for (let i = 1; i < data.length; i++) {
    const rowPhone = data[i][phoneIdx].toString().replace(/\\D/g, '');
    if (rowPhone.slice(-9) === target.slice(-9)) {
       if (noteIdx !== -1) {
         sheet.getRange(i+1, noteIdx+1).setValue("LAST REPLY: " + snippet);
       }
       break;
    }
  }
}

function getRowsData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('zenith_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('zenith_session');
      }
    }
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeyReady(hasKey);
    } else {
      setApiKeyReady(true);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setApiKeyReady(true);
      notify("Neural Engine key synchronized.");
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    notify("Meta Webhook Backend Core copied.");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridgeUrl) return notify('Bridge Protocol URL required.', 'error');
    localStorage.setItem('zenith_script_url', bridgeUrl);
    setLoading(true);

    try {
      const usersData = await sheetsService.fetchData('Users');
      const foundUser = usersData.find(
        (u: any) => 
          u.username?.toString().toLowerCase() === loginForm.username.toLowerCase() && 
          u.password?.toString() === loginForm.password
      );

      if (foundUser) {
        setUser(foundUser);
        setIsLoggedIn(true);
        localStorage.setItem('zenith_session', JSON.stringify(foundUser));
        notify(`Identity Verified: ${foundUser.name}`);
      } else {
        notify('Verification Failed: Invalid Access Key.', 'error');
      }
    } catch (err: any) {
      notify('Link Failure: Check Protocol URL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <ToastContext.Provider value={{ notify }}>
        <div className="min-h-screen flex bg-[#020617] text-white overflow-hidden font-sans">
          {/* Left Panel: Feature Showcase */}
          <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-24 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-slate-950 border-r border-slate-800">
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
             
             <div className="relative z-10 space-y-12">
                <div className="flex items-center gap-4">
                   <img 
                      src="https://drive.google.com/uc?export=view&id=1cR5t_XGWXqfHOba-WQ-v4tAxXO_ZFy8L" 
                      alt="WhatsAi Logo" 
                      className="w-20 h-20 rounded-2xl shadow-2xl shadow-indigo-500/30 object-cover border border-white/10"
                   />
                   <div className="flex flex-col">
                      <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">WhatsAi <br/><span className="text-indigo-500">Agent</span></h1>
                      <span className="text-[10px] font-black tracking-[0.4em] text-indigo-500/50 mt-1">v12.4 COGNITIVE ENGINE</span>
                   </div>
                </div>

                <div className="space-y-8">
                   <h2 className="text-5xl font-black leading-tight tracking-tight">The Neural Future of <br/><span className="text-indigo-500">Client Acquisition.</span></h2>
                   <div className="space-y-6">
                      {[
                        { icon: <ICONS.Sparkles className="w-5 h-5"/>, title: "Neural Response Synthesis", desc: "Automated objection handling in local dialects (Darija, Masri, etc.) using Gemini 3." },
                        { icon: <ICONS.WhatsApp className="w-5 h-5"/>, title: "Autonomous Sales Agents", desc: "24/7 AI-driven closures that turn conversations into confirmed orders instantly." },
                        { icon: <ICONS.Sparkles className="w-5 h-5"/>, title: "Hyper-Personalized Creative", desc: "Instantly generate unique marketing images, videos, and audio for every lead." },
                        { icon: <ICONS.Integrations className="w-5 h-5"/>, title: "Zero-Latency Sheets Sync", desc: "Your Google Sheets are now an enterprise-grade backend with real-time Meta updates." },
                        { icon: <ICONS.Dashboard className="w-5 h-5"/>, title: "Predictive Analytics", desc: "Analyze transmission velocity and billing categories to optimize your ROI." }
                      ].map((feat, i) => (
                        <div key={i} className="flex gap-5 items-start animate-in fade-in slide-in-from-left duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                           <div className="mt-1 p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">{feat.icon}</div>
                           <div>
                              <h4 className="font-bold text-lg text-slate-100">{feat.title}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="absolute bottom-12 left-24 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                WHATS-AI AGENT OS // ENTERPRISE CRM CORE // PROTECTED BY NEURAL SECURE
             </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
             <div className="w-full max-w-[420px] space-y-10 animate-in fade-in slide-in-from-right-10">
                <div className="space-y-2">
                   <h3 className="text-3xl font-black tracking-tight">Access Terminal</h3>
                   <p className="text-slate-500 font-medium">Verify your identity to establish secure hub synchronization.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Operator Identity</label>
                      <input 
                        type="text" 
                        placeholder="Operator Username" 
                        required 
                        className="w-full bg-slate-900 border border-slate-800 rounded-[1.25rem] p-5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-700" 
                        value={loginForm.username} 
                        onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secure Passkey</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        required 
                        className="w-full bg-slate-900 border border-slate-800 rounded-[1.25rem] p-5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-700" 
                        value={loginForm.password} 
                        onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Bridge Protocol URL</label>
                      <input 
                        type="text" 
                        placeholder="https://script.google.com/..." 
                        required 
                        className="w-full bg-indigo-950/20 border border-indigo-900/30 rounded-[1.25rem] p-5 text-[10px] font-mono text-indigo-400 focus:border-indigo-500 outline-none transition-all" 
                        value={bridgeUrl} 
                        onChange={e => setBridgeUrl(e.target.value)} 
                      />
                   </div>
                   
                   <button 
                     disabled={loading}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-[1.25rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {loading ? (
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                       <>Establish Link <ICONS.ChevronRight className="w-4 h-4" /></>
                     )}
                   </button>
                </form>

                <div className="pt-10 flex flex-col items-center gap-4 border-t border-slate-800">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Administrative Deployment</p>
                   <button 
                     onClick={() => setShowScriptModal(true)}
                     className="text-indigo-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group"
                   >
                     <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                     </div>
                     Extract Backend Core
                   </button>
                </div>
             </div>
          </div>

          {showScriptModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
               <div className="w-full max-w-4xl glass-panel rounded-[3rem] border border-slate-800 flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                     <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-indigo-400">Core Protocol Extraction</h3>
                        <p className="text-slate-500 text-xs font-medium">Inject this core logic into your Google Cloud Apps Script editor to enable Webhooks.</p>
                     </div>
                     <button onClick={() => setShowScriptModal(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                  </div>
                  <div className="flex-1 overflow-hidden p-8 flex flex-col gap-6">
                     <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-6 overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar relative group">
                        <button 
                          onClick={handleCopyScript}
                          className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
                        >
                          Copy Logic
                        </button>
                        <pre className="text-indigo-300">
                          {appsScriptCode}
                        </pre>
                     </div>
                  </div>
               </div>
            </div>
          )}
          
          <div className="fixed bottom-8 right-8 z-[100] space-y-4">
             {toasts.map(t => (
               <div key={t.id} className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right duration-300 ${t.type === 'error' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${t.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                  <span className="text-xs font-black uppercase tracking-widest leading-none">{t.message}</span>
               </div>
             ))}
          </div>
        </div>
      </ToastContext.Provider>
    );
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={() => { setIsLoggedIn(false); localStorage.removeItem('zenith_session'); }}>
        {!apiKeyReady && (
          <div className="mb-8 p-6 glass-panel border-l-4 border-amber-500 rounded-2xl flex items-center justify-between animate-pulse">
             <div>
               <h4 className="font-black text-amber-500 uppercase text-[10px] tracking-widest">Matrix Synthesis Locked</h4>
               <p className="text-xs text-slate-400">Enable Neural API key to unlock image and video generation features.</p>
             </div>
             <button onClick={handleSelectKey} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">Unlock Features</button>
          </div>
        )}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'whatsapp' && <WhatsAppHub />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'team' && <Team />}
        {activeTab === 'integrations' && <Integrations />}
        {activeTab === 'settings' && <Settings />}
        
        <div className="fixed bottom-8 right-8 z-[100] space-y-4">
           {toasts.map(t => (
             <div key={t.id} className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right duration-300 ${t.type === 'error' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${t.type === 'error' ? 'bg-rose-500' : t.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                <span className="text-xs font-black uppercase tracking-widest leading-none">{t.message}</span>
             </div>
           ))}
        </div>
      </Layout>
    </ToastContext.Provider>
  );
};

export default App;
