
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
      notify("AI Engine key updated successfully.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridgeUrl) return notify('Bridge URL required for synchronization.', 'error');
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
        notify(`Welcome back, ${foundUser.name}`);
      } else {
        notify('Invalid credentials. Access denied.', 'error');
      }
    } catch (err: any) {
      notify('Connection failed. Verify Bridge URL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <ToastContext.Provider value={{ notify }}>
        <div className="min-h-screen flex bg-[#020617] text-white overflow-hidden">
          {/* Left Panel: Feature Showcase */}
          <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-24 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-slate-950 border-r border-slate-800">
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
             
             <div className="relative z-10 space-y-12">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                      <span className="text-3xl font-black italic">Z</span>
                   </div>
                   <h1 className="text-4xl font-black tracking-tighter uppercase italic">Zenith <span className="text-indigo-500">AI</span></h1>
                </div>

                <div className="space-y-8">
                   <h2 className="text-5xl font-black leading-tight tracking-tight">The Neural Core of <br/><span className="text-indigo-500">WhatsApp Commerce.</span></h2>
                   <div className="space-y-6">
                      {[
                        { icon: <ICONS.Sparkles className="w-5 h-5"/>, title: "AI Neural Agent", desc: "Automated high-conversion sales closure in Moroccan Darija." },
                        { icon: <ICONS.WhatsApp className="w-5 h-5"/>, title: "Precision Broadcasting", desc: "Segmented bulk transmissions with real-time delivery tracking." },
                        { icon: <ICONS.Integrations className="w-5 h-5"/>, title: "Sheets Unified Backend", desc: "Infinite scale with Google Sheets as your high-speed database." }
                      ].map((feat, i) => (
                        <div key={i} className="flex gap-5 items-start">
                           <div className="mt-1 p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">{feat.icon}</div>
                           <div>
                              <h4 className="font-bold text-lg">{feat.title}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="absolute bottom-12 left-24 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                Zenith OS v2.5 // PRO CRM SOLUTION
             </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
             <div className="w-full max-w-[420px] space-y-10 animate-in fade-in slide-in-from-right-10">
                <div className="space-y-2">
                   <h3 className="text-3xl font-black tracking-tight">System Access</h3>
                   <p className="text-slate-500 font-medium">Identify yourself to synchronize with the neural hub.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Operator Identity</label>
                      <input 
                        type="text" 
                        placeholder="Username" 
                        required 
                        className="w-full bg-slate-900 border border-slate-800 rounded-[1.25rem] p-5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all" 
                        value={loginForm.username} 
                        onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Access Key</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        required 
                        className="w-full bg-slate-900 border border-slate-800 rounded-[1.25rem] p-5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all" 
                        value={loginForm.password} 
                        onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Bridge Protocol (Apps Script URL)</label>
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

                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                   Proprietary Technology of Zenith Intelligence Hub
                </p>
             </div>
          </div>
          
          {/* Toast Container */}
          <div className="fixed bottom-8 right-8 z-[100] space-y-4">
             {toasts.map(t => (
               <div key={t.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${t.type === 'error' ? 'bg-rose-950 border-rose-500/50 text-rose-100' : 'bg-slate-900 border-indigo-500/50 text-indigo-100'}`}>
                  {t.type === 'error' ? '⚠️' : '✅'}
                  <span className="text-sm font-bold">{t.message}</span>
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
               <h4 className="font-bold text-amber-500 uppercase text-xs">High-Resolution AI Required</h4>
               <p className="text-xs text-slate-400">Enable a paid API key to unlock Veo Video generation.</p>
             </div>
             <button onClick={handleSelectKey} className="bg-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Enable Features</button>
          </div>
        )}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'whatsapp' && <WhatsAppHub />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'team' && <Team />}
        {activeTab === 'integrations' && <Integrations />}
        {activeTab === 'settings' && <Settings />}
        
        {/* Toast Container */}
        <div className="fixed bottom-8 right-8 z-[100] space-y-4">
           {toasts.map(t => (
             <div key={t.id} className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right duration-300 ${t.type === 'error' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${t.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                <span className="text-xs font-black uppercase tracking-widest">{t.message}</span>
             </div>
           ))}
        </div>
      </Layout>
    </ToastContext.Provider>
  );
};

export default App;
