
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

const DEFAULT_LOGO = "https://drive.google.com/uc?export=view&id=1cR5t_XGWXqfHOba-WQ-v4tAxXO_ZFy8L";

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [brandInfo, setBrandInfo] = useState({
    name: localStorage.getItem('zenith_name') || 'WhatsAi Agent',
    logo: localStorage.getItem('zenith_logo') || DEFAULT_LOGO
  });

  useEffect(() => {
    const handleSync = () => {
      setBrandInfo({
        name: localStorage.getItem('zenith_name') || 'WhatsAi Agent',
        logo: localStorage.getItem('zenith_logo') || DEFAULT_LOGO
      });
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard },
    { id: 'whatsapp', label: 'WhatsApp Hub', icon: ICONS.WhatsApp },
    { id: 'clients', label: 'Clients CRM', icon: ICONS.Clients },
    { id: 'team', label: 'Team & Billing', icon: ICONS.Team },
    { id: 'integrations', label: 'Integrations', icon: ICONS.Integrations },
    { id: 'settings', label: 'Settings', icon: ICONS.Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} glass-panel border-r border-slate-800 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <img 
            src={brandInfo.logo} 
            alt="Brand Logo" 
            className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/30 object-cover border border-white/5"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://img.icons8.com/fluency/48/bot.png"; }}
          />
          {isSidebarOpen && (
             <span className="font-black text-lg tracking-tighter uppercase italic truncate">
                {brandInfo.name.split(' ').map((word, i) => (
                   <span key={i} className={i === 1 ? "text-indigo-500" : ""}>{word} </span>
                ))}
             </span>
          )}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 shadow-inner' 
                : 'hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black">
               {user?.name?.charAt(0) || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{user?.name || 'User'}</span>
                <span className="text-xs text-slate-500 truncate uppercase tracking-widest">{user?.role || 'Agent'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <ICONS.Logout className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 glass-panel border-b border-slate-800/50 z-10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-900/50 border border-slate-700/50 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all"
              />
              <ICONS.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            <button className="relative w-10 h-10 flex items-center justify-center bg-slate-800/50 rounded-full border border-slate-700/50 hover:bg-slate-700 transition-colors">
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
