import React, { useState, useEffect } from 'react';
import { User, Phone, CheckCircle, XCircle, Globe, ExternalLink } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { Complaint, UserProfile } from '../types';
import { getComplaints, saveComplaint, updateComplaint } from '../services/storageService';
import { formatToDisplayDate } from '../services/reportService';

interface CRMProps {
  user: UserProfile;
}

const CRM: React.FC<CRMProps> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [formData, setFormData] = useState({ 
      customerName: '', 
      phoneNumber: '', 
      productModel: '', 
      issueType: 'Installation' as const,
      callType: 'Inbound' as const
  });
  const [view, setView] = useState<'new' | 'history'>('history');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const refreshData = async () => {
    const list = await getComplaints();
    setComplaints(list);
  };

  useEffect(() => { refreshData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const newComplaint: Complaint = { 
        id: newId, 
        ...formData, 
        isResolved: false, 
        date: new Date().toISOString() 
    };
    await saveComplaint(newComplaint);
    await refreshData();
    setLastSavedId(newId);
    setShowSuccessModal(true);
    setFormData({ customerName: '', phoneNumber: '', productModel: '', issueType: 'Installation', callType: 'Inbound' });
  };

  const handleRedirect = (type: 'site' | 'call') => {
      if (type === 'site' && user.brandSiteUrl) {
          window.open(user.brandSiteUrl, '_blank');
      } else if (type === 'call' && user.tollFreeNumber) {
          window.location.href = `tel:${user.tollFreeNumber}`;
      }
      setShowSuccessModal(false);
      setView('history');
  };

  const toggleStatus = async (complaint: Complaint) => {
    const updated = { ...complaint, isResolved: !complaint.isResolved };
    await updateComplaint(updated);
    await refreshData();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400">CRM</h2><button onClick={() => setView(view === 'new' ? 'history' : 'new')} className="text-zinc-500 dark:text-zinc-400 font-semibold">{view === 'new' ? 'Cancel' : '+ New Ticket'}</button></div>
       {view === 'new' ? (
           <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
               <GlassCard className="p-6 space-y-4 rounded-2xl"><h3 className="font-semibold text-lg border-b border-gray-200 dark:border-white/10 pb-2">New Ticket</h3><div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-400">Customer Name</label><GlassInput required placeholder="Enter customer name" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="rounded-2xl" /></div><div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-400">Phone</label><GlassInput required type="tel" placeholder="9876543210" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="rounded-2xl" /></div><div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-400">Product Model</label><GlassInput required placeholder="Mixer Grinder GX1" value={formData.productModel} onChange={e => setFormData({...formData, productModel: e.target.value})} className="rounded-2xl" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-400">Issue Type</label><select className="w-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 rounded-2xl px-4 py-3 outline-none text-zinc-800 dark:text-white shadow-sm" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value as any})}><option value="Installation" className="text-black">Installation</option><option value="Complaint" className="text-black">Complaint</option></select></div><div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-400">Call Type</label><select className="w-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 rounded-2xl px-4 py-3 outline-none text-zinc-800 dark:text-white shadow-sm" value={formData.callType} onChange={e => setFormData({...formData, callType: e.target.value as any})}><option value="Inbound" className="text-black">Inbound</option><option value="Outbound" className="text-black">Outbound</option></select></div></div><GlassButton type="submit" className="w-full mt-4 rounded-2xl">Create Ticket</GlassButton></GlassCard>
           </form>
       ) : (
           <div className="space-y-4">
               {complaints.length === 0 && <p className="text-center text-zinc-500 py-10">No tickets raised yet.</p>}
               {complaints.sort((a,b) => b.date.localeCompare(a.date)).map(c => (
                   <GlassCard key={c.id} className="p-4 relative overflow-hidden group rounded-2xl"><div className={`absolute top-0 left-0 w-1 h-full ${c.isResolved ? 'bg-green-500' : 'bg-red-500'}`} /><div className="pl-3 flex justify-between items-start"><div><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] px-2 py-0.5 rounded-2xl border font-bold uppercase tracking-wider ${c.issueType === 'Installation' ? 'bg-blue-100/50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-orange-100/50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300'}`}>{c.issueType}</span><span className="text-xs text-zinc-400">{formatToDisplayDate(c.date)}</span></div><h4 className="font-bold text-lg">{c.customerName}</h4><p className="text-sm text-zinc-500">{c.productModel}</p><a href={`tel:${c.phoneNumber}`} className="text-sm text-blue-500 flex items-center gap-1 mt-1"><Phone size={12} /> {c.phoneNumber}</a></div><button onClick={() => toggleStatus(c)} className={`p-2 rounded-2xl transition-colors ${c.isResolved ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-zinc-300 bg-zinc-100 dark:bg-zinc-800'}`}>{c.isResolved ? <CheckCircle /> : <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />}</button></div></GlassCard>
               ))}
           </div>
       )}

       <Modal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); setView('history'); }} title="Ticket Created">
           <div className="space-y-4 text-center py-4">
               <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                   <CheckCircle size={32} />
               </div>
               <p className="text-zinc-600 dark:text-zinc-300">Ticket saved successfully. What would you like to do next?</p>
               <div className="grid grid-cols-1 gap-3">
                   {user.brandSiteUrl && (
                       <GlassButton onClick={() => handleRedirect('site')} className="w-full rounded-2xl flex items-center justify-center gap-2">
                           <Globe size={18} /> Open Brand Site
                       </GlassButton>
                   )}
                   {user.tollFreeNumber && (
                       <GlassButton onClick={() => handleRedirect('call')} className="w-full rounded-2xl flex items-center justify-center gap-2" variant="secondary">
                           <Phone size={18} /> Call Toll Free
                       </GlassButton>
                   )}
                   <GlassButton onClick={() => { setShowSuccessModal(false); setView('history'); }} variant="secondary" className="w-full rounded-2xl">
                       Done
                   </GlassButton>
               </div>
           </div>
       </Modal>
    </div>
  );
};

export default CRM;