import React, { useState } from 'react';
import { User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { Complaint } from '../types';
import { getComplaints, saveComplaint, updateComplaint } from '../services/storageService';

const CRM: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>(getComplaints());
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    productModel: '',
    issueType: 'Installation' as const
  });
  const [view, setView] = useState<'new' | 'history'>('history');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newComplaint: Complaint = {
      id: Date.now().toString(),
      ...formData,
      isResolved: false,
      date: new Date().toISOString()
    };
    saveComplaint(newComplaint);
    setComplaints(getComplaints());
    setFormData({ customerName: '', phoneNumber: '', productModel: '', issueType: 'Installation' });
    setView('history');
  };

  const toggleStatus = (complaint: Complaint) => {
    const updated = { ...complaint, isResolved: !complaint.isResolved };
    updateComplaint(updated);
    setComplaints(getComplaints());
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">CRM</h2>
           <button 
             onClick={() => setView(view === 'new' ? 'history' : 'new')}
             className="text-blue-500 font-semibold"
           >
               {view === 'new' ? 'Cancel' : '+ New Ticket'}
           </button>
       </div>

       {view === 'new' ? (
           <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
               <GlassCard className="p-6 space-y-4">
                   <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-white/10 pb-2">New Ticket</h3>
                   <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400">Customer Name</label>
                       <GlassInput 
                           required
                           placeholder="Enter customer name"
                           value={formData.customerName} 
                           onChange={e => setFormData({...formData, customerName: e.target.value})} 
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400">Phone</label>
                       <GlassInput 
                           required
                           type="tel"
                           placeholder="9876543210"
                           value={formData.phoneNumber} 
                           onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400">Product Model</label>
                       <GlassInput 
                           required
                           placeholder="Mixer Grinder GX1"
                           value={formData.productModel} 
                           onChange={e => setFormData({...formData, productModel: e.target.value})} 
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-400">Type</label>
                       <select 
                           className="w-full bg-white/40 dark:bg-zinc-800/50 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-slate-800 dark:text-white"
                           value={formData.issueType}
                           onChange={e => setFormData({...formData, issueType: e.target.value as any})}
                       >
                           <option value="Installation" className="text-black">Installation</option>
                           <option value="Complaint" className="text-black">Complaint</option>
                       </select>
                   </div>
                   <GlassButton type="submit" className="w-full mt-4">Create Ticket</GlassButton>
               </GlassCard>
           </form>
       ) : (
           <div className="space-y-4">
               {complaints.length === 0 && <p className="text-center text-slate-500 py-10">No tickets raised yet.</p>}
               {complaints.map(c => (
                   <GlassCard key={c.id} className="p-4 relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 w-1 h-full ${c.isResolved ? 'bg-green-500' : 'bg-red-500'}`} />
                       <div className="pl-3 flex justify-between items-start">
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${c.issueType === 'Installation' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                                       {c.issueType}
                                   </span>
                                   <span className="text-xs text-slate-400">{new Date(c.date).toLocaleDateString()}</span>
                               </div>
                               <h4 className="font-bold text-lg">{c.customerName}</h4>
                               <p className="text-sm text-slate-500">{c.productModel}</p>
                               <a href={`tel:${c.phoneNumber}`} className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                                   <Phone size={12} /> {c.phoneNumber}
                               </a>
                           </div>
                           <button 
                               onClick={() => toggleStatus(c)}
                               className={`p-2 rounded-full transition-colors ${c.isResolved ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-300 bg-slate-100 dark:bg-zinc-800'}`}
                           >
                               {c.isResolved ? <CheckCircle /> : <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-zinc-600" />}
                           </button>
                       </div>
                   </GlassCard>
               ))}
           </div>
       )}
    </div>
  );
};

export default CRM;