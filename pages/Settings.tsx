
import React, { useState, useEffect } from 'react';
import { useNotify } from '../App.tsx';

const LANGUAGES = [
  { id: 'Moroccan Darija', label: 'Morocco (Darija)', icon: '🇲🇦' },
  { id: 'Algerian Arabic', label: 'Algeria (Dialect)', icon: '🇩🇿' },
  { id: 'Tunisian Arabic', label: 'Tunisia (Dialect)', icon: '🇹🇳' },
  { id: 'Egyptian Arabic', label: 'Egypt (Masri)', icon: '🇪🇬' },
  { id: 'Gulf Arabic', label: 'Gulf (UAE/KSA)', icon: '🇦🇪' },
  { id: 'French', label: 'French (Standard)', icon: '🇫🇷' },
  { id: 'English', label: 'English (US/UK)', icon: '🇺🇸' },
  { id: 'Spanish', label: 'Spanish (LatAm/ES)', icon: '🇪🇸' },
];

const DEFAULT_LOGO = "https://drive.google.com/uc?export=view&id=1cR5t_XGWXqfHOba-WQ-v4tAxXO_ZFy8L";

const Settings: React.FC = () => {
  const { notify } = useNotify();
  const [config, setConfig] = useState({
    businessName: localStorage.getItem('zenith_name') || 'WhatsAi Agent',
    logoUrl: DEFAULT_LOGO,
    scriptUrl: localStorage.getItem('zenith_script_url') || '',
    primaryColor: localStorage.getItem('zenith_color') || '#6366f1',
    language: localStorage.getItem('zenith_lang') || 'Moroccan Darija'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('zenith_name', config.businessName);
    localStorage.setItem('zenith_logo', config.logoUrl);
    localStorage.setItem('zenith_script_url', config.scriptUrl);
    localStorage.setItem('zenith_color', config.primaryColor);
    localStorage.setItem('zenith_lang', config.language);
    
    setTimeout(() => {
      setIsSaving(false);
      notify('Neural parameters synchronized successfully.', 'success');
      window.dispatchEvent(new Event('storage'));
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="glass-panel p-10 rounded-[2.5rem] space-y-10 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase italic">Core Configuration</h3>
            <p className="text-slate-500 text-sm font-medium">Manage your branding, neural bridge and linguistics protocol.</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${config.scriptUrl ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
             {config.scriptUrl ? 'Bridge Active' : 'Bridge Offline'}
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Business Brand Name</label>
                <input 
                  type="text" 
                  value={config.businessName}
                  onChange={e => setConfig({...config, businessName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500/50 outline-none" 
                  placeholder="e.g. WhatsAi Agent"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Corporate Brand Identity</label>
                <div className="flex items-center gap-4 p-2 bg-slate-950/50 border border-slate-800 rounded-2xl">
                   <img 
                      src={config.logoUrl} 
                      alt="Fixed Logo" 
                      className="w-12 h-12 rounded-xl object-cover border border-white/5 shadow-lg"
                   />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-400 uppercase">WhatsAi Robo Agent</span>
                      <span className="text-[9px] text-slate-500">Universal Branding Applied</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-8">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Apps Script Protocol URL</label>
            <input 
              type="text" 
              value={config.scriptUrl}
              onChange={e => setConfig({...config, scriptUrl: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-[11px] text-indigo-400 focus:ring-1 focus:ring-indigo-500/50 outline-none" 
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Linguistics</h4>
              </div>
              <div className="relative group">
                <select 
                  value={config.language}
                  onChange={e => setConfig({...config, language: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-sm font-bold appearance-none focus:border-indigo-500 outline-none transition-all pr-12"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id} className="bg-slate-950 text-white">
                      {lang.icon} {lang.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Appearance Accent</h4>
               </div>
              <div className="space-y-2">
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={config.primaryColor}
                    onChange={e => setConfig({...config, primaryColor: e.target.value})}
                    className="w-16 h-12 rounded-2xl bg-slate-950 border border-slate-800 outline-none cursor-pointer" 
                  />
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 uppercase font-bold">{config.primaryColor}</span>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 flex gap-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] py-5 rounded-[1.25rem] shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Commit All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
