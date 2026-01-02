
import React, { useState, useEffect } from 'react';
import { sheetsService } from '../services/sheetsService.ts';
import { User } from '../types.ts';
import { ICONS } from '../constants.tsx';

const Team: React.FC = () => {
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '', password: '', role: 'agent', name: '', commissionvalue: 0, commissiontype: 'Percentage'
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    const data = await sheetsService.fetchData('Users');
    setTeam(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleOpenModal = (member?: User) => {
    if (member) {
      setFormData(member);
      setEditingId(member.username);
    } else {
      setFormData({ username: '', password: '', role: 'agent', name: '', commissionvalue: 0, commissiontype: 'Percentage' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (editingId) {
      await sheetsService.updateData('Users', formData, 'username', editingId);
    } else {
      await sheetsService.createData('Users', formData);
    }
    
    await loadTeam();
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDeleteMember = async (username: string) => {
    if (!window.confirm(`Remove access for @${username}?`)) return;
    setLoading(true);
    await sheetsService.deleteData('Users', 'username', username);
    await loadTeam();
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-indigo-500">
          <p className="text-slate-400 text-sm font-medium">Active Agents</p>
          <h3 className="text-3xl font-bold mt-1">{team.length}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-emerald-500">
          <p className="text-slate-400 text-sm font-medium">Network Security</p>
          <h3 className="text-3xl font-bold mt-1">SSL-AI</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-purple-500">
          <p className="text-slate-400 text-sm font-medium">System Role</p>
          <h3 className="text-3xl font-bold mt-1">Neural CRM</h3>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Team Members</h3>
            <p className="text-sm text-slate-500">Manage access and billing details</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all"
          >
            <ICONS.Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {team.map((member) => (
            <div key={member.username || Math.random().toString()} className="flex items-center justify-between p-6 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-600 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-indigo-400 border border-indigo-500/20">
                  {(member.name || 'U').charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{member.name || 'Unnamed Agent'}</h4>
                  <p className="text-slate-500 text-sm">@{member.username || 'unknown'} • <span className="text-indigo-400 font-medium capitalize">{member.role || 'Agent'}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Commission</p>
                  <p className="font-bold">
                    {member.commissionvalue || 0}
                    <span className="text-xs ml-1 text-slate-400">{member.commissiontype === 'Percentage' ? '%' : 'MAD'}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(member)} className="p-2 text-slate-500 hover:text-white bg-slate-800/50 rounded-lg border border-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button onClick={() => handleDeleteMember(member.username)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {team.length === 0 && !loading && (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No team members synchronized</p>
            </div>
          )}
        </div>
      </div>

      {/* MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-8 rounded-[2.5rem] border border-slate-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">{editingId ? 'Edit Agent Access' : 'Register New Agent'}</h3>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input required className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Username</label>
                  <input required disabled={!!editingId} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm disabled:opacity-50" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                  <input required type="password" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Comm. Type</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={formData.commissiontype} onChange={e => setFormData({...formData, commissiontype: e.target.value})}>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed (MAD)</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Commission Value</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={formData.commissionvalue} onChange={e => setFormData({...formData, commissionvalue: Number(e.target.value)})} />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button disabled={loading} type="submit" className="flex-1 bg-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingId ? 'Update Access' : 'Register Member')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-slate-800 rounded-xl font-bold text-slate-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
