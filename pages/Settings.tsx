
import React, { useState } from 'react';
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

const Settings: React.FC = () => {
  const { notify } = useNotify();
  const [config, setConfig] = useState({
    businessName: localStorage.getItem('zenith_biz_name') || 'Zenith Store',
    logoUrl: localStorage.getItem('zenith_logo_url') || 'https://picsum.photos/200',
    scriptUrl: localStorage.getItem('zenith_script_url') || '',
    primaryColor: localStorage.getItem('zenith_color') || '#6366f1',
    language: localStorage.getItem('zenith_lang') || 'Moroccan Darija'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('zenith_biz_name', config.businessName);
    localStorage.setItem('zenith_logo_url', config.logoUrl);
    localStorage.setItem('zenith_script_url', config.scriptUrl);
    localStorage.setItem('zenith_color', config.primaryColor);
    localStorage.setItem('zenith_lang', config.language);
    
    setTimeout(() => {
      setIsSaving(false);
      notify('Neural parameters synchronized.');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="glass-panel p-10 rounded-[2.5rem] space-y-10 border border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase italic">Core Configuration</h3>
            <p className="text-slate-500 text-sm font-medium">Manage your neural bridge and business parameters.</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${config.scriptUrl ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
             {config.scriptUrl ? 'Link Established' : 'Link Missing'}
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Bridge URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Apps Script Protocol URL</label>
            <input 
              type="text" 
              value={config.scriptUrl}
              onChange={e => setConfig({...config, scriptUrl: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-[11px] text-indigo-400 focus:ring-1 focus:ring-indigo-500/50 outline-none" 
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>

          {/* Language Selection */}
          <div className="pt-8 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Linguistics</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setConfig({...config, language: lang.id})}
                  className={`p-4 rounded-2xl border text-left transition-all ${config.language === lang.id ? 'bg-indigo-600 border-indigo-400 shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                >
                  <span className="text-xl mb-2 block">{lang.icon}</span>
                  <p className={`text-[10px] font-black uppercase tracking-tighter ${config.language === lang.id ? 'text-white' : 'text-slate-400'}`}>{lang.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-800">
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branding</h4>
               </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Business Identity</label>
                <input 
                  type="text" 
                  value={config.businessName}
                  onChange={e => setConfig({...config, businessName: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Asset Logo (URL)</label>
                <input 
                  type="text" 
                  value={config.logoUrl}
                  onChange={e => setConfig({...config, logoUrl: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-slate-500" 
                />
              </div>
            </div>
            
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interface</h4>
               </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Primary Accent Color</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={config.primaryColor}
                    onChange={e => setConfig({...config, primaryColor: e.target.value})}
                    className="w-16 h-12 rounded-2xl bg-slate-950 border border-slate-800 outline-none cursor-pointer" 
                  />
                  <span className="font-mono text-xs text-slate-400 uppercase font-bold">{config.primaryColor}</span>
                </div>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Force Dark Terminal</span>
                <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center px-1">
                  <div className="w-3.5 h-3.5 bg-white rounded-full translate-x-4"></div>
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
            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Commit Changes'}
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-[1.25rem] transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="p-10 bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] flex items-center justify-between">
        <div>
          <h4 className="font-black text-xl uppercase tracking-tighter mb-1 text-slate-200">Scale Your Business</h4>
          <p className="text-slate-500 text-sm font-medium">Custom automation flows or AI fine-tuning?</p>
        </div>
        <button className="bg-white text-indigo-600 font-black px-8 py-3.5 rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
          Contact Engineering
        </button>
      </div>
    </div>
  );
};

export default Settings;
