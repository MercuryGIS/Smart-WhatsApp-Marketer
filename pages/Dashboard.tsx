
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { sheetsService } from '../services/sheetsService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const StatCard = ({ title, value, change, color, icon }: any) => (
  <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group hover:translate-y-[-5px] transition-all duration-500 shadow-xl border border-slate-800/50">
    <div className={`absolute -top-10 -right-10 w-40 h-40 bg-${color}-500/10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000`}></div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 mb-6 border border-${color}-500/20 shadow-inner`}>
        {icon}
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <div className="flex items-end justify-between mt-3">
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${change?.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {change}
        </div>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalRevenue: 0,
    avgOrder: 0,
    deliveryRate: '0%',
    recentClients: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const clients = await sheetsService.fetchData('Clients');
    if (clients && clients.length > 0) {
      // Fix property casing to lowercase to match mock data and types.
      const totalRev = clients.reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0);
      const delivered = clients.filter((c: any) => c.statuses === 'Delivered').length;
      setStats({
        totalClients: clients.length,
        totalRevenue: totalRev,
        avgOrder: Math.round(totalRev / clients.length),
        deliveryRate: `${Math.round((delivered / clients.length) * 100)}%`,
        recentClients: clients.slice(-5).reverse()
      });
    }
    setLoading(false);
  };

  const chartData = [
    { name: 'Mon', revenue: 4000, interactions: 2400 },
    { name: 'Tue', revenue: 3000, interactions: 1398 },
    { name: 'Wed', revenue: 2000, interactions: 9800 },
    { name: 'Thu', revenue: 2780, interactions: 3908 },
    { name: 'Fri', revenue: 1890, interactions: 4800 },
    { name: 'Sat', revenue: 2390, interactions: 3800 },
    { name: 'Sun', revenue: 3490, interactions: 4300 },
  ];

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Active Network" value={stats.totalClients} change="+12%" color="indigo" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard title="Gross Volume" value={`${stats.totalRevenue.toLocaleString()} MAD`} change="+24%" color="purple" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard title="AI Precision" value="98.2%" change="+1.2%" color="emerald" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>} />
        <StatCard title="Response Rate" value="0:45m" change="-10%" color="orange" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] h-[500px] border border-slate-800/50 relative">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Engagement Flux</h4>
              <p className="text-slate-500 text-xs font-medium">Interactions vs Conversions (Real-time)</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Interactions</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Volume</span>
               </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fluxIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="fluxPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
              <YAxis stroke="#475569" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="interactions" stroke="#6366f1" strokeWidth={4} fill="url(#fluxIndigo)" />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={4} fill="url(#fluxPurple)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-10 rounded-[3rem] flex flex-col border border-slate-800/50">
          <h4 className="text-2xl font-black uppercase tracking-tighter mb-8">Live Feed</h4>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {stats.recentClients.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  {/* Fix property casing to lowercase for client and city. */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black group-hover:bg-indigo-600 transition-colors">
                    {c.client?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black">{c.client}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{c.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  {/* Fix property casing to lowercase for price and statuses. */}
                  <p className="text-sm font-black text-indigo-400">{c.price} MAD</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">{c.statuses}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
