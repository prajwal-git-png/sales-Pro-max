import { useState, useEffect } from 'react';
import { Phone, CheckCircle, Globe, Plus, ClipboardList, Package } from 'lucide-react';
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
      customProductName: '',
      issueType: 'Installation' as const
  });
  const [view, setView] = useState<'new' | 'history'>('history');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const refreshData = async () => {
    const list = await getComplaints();
    setComplaints(list);
  };

  useEffect(() => { refreshData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phoneNumber.length !== 10) {
        alert("Phone number must be exactly 10 digits.");
        return;
    }
    const newId = Date.now().toString();
    const newComplaint: Complaint = { 
        id: newId, 
        ...formData, 
        isResolved: false, 
        date: new Date().toISOString() 
    };
    await saveComplaint(newComplaint);
    await refreshData();
    setShowSuccessModal(true);
    setFormData({ customerName: '', phoneNumber: '', productModel: '', customProductName: '', issueType: 'Installation' });
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400">CRM</h2>
               {/* Quick Actions */}
               {(user.tollFreeNumber || user.brandSiteUrl) && (
                   <div className="flex items-center gap-2 ml-2">
                       {user.tollFreeNumber && (
                           <button onClick={() => window.location.href = `tel:${user.tollFreeNumber}`} className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:scale-110 transition-transform shadow-sm" title="Call Service Center">
                               <Phone size={16} />
                           </button>
                       )}
                       {user.brandSiteUrl && (
                           <button onClick={() => window.open(user.brandSiteUrl, '_blank')} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 transition-transform shadow-sm" title="Open Brand Site">
                               <Globe size={16} />
                           </button>
                       )}
                   </div>
               )}
           </div>
           <div className="flex p-1 bg-white/40 dark:bg-white/10 rounded-3xl border border-white/50 dark:border-white/20 backdrop-blur-md">
               <button onClick={() => setView('history')} className={`px-4 py-1.5 rounded-3xl text-xs font-bold transition-all ${view === 'history' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-zinc-500'}`}>History</button>
               <button onClick={() => setView('new')} className={`px-4 py-1.5 rounded-3xl text-xs font-bold transition-all ${view === 'new' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-zinc-500'}`}>New Ticket</button>
           </div>
       </div>

       {view === 'new' ? (
           <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4">
               <GlassCard className="p-6 space-y-5 rounded-3xl">
                   <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3 mb-2">
                       <Plus className="text-blue-500" size={20} />
                       <h3 className="font-bold text-lg">Create New Ticket</h3>
                   </div>
                   
                   <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Customer Name</label>
                       <GlassInput required placeholder="Enter customer name" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="rounded-3xl" />
                   </div>
                   
                   <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Phone Number</label>
                       <GlassInput required type="tel" maxLength={10} placeholder="9876543210" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="rounded-3xl" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Product Model</label>
                           <GlassInput required placeholder="GX1 Mixer" value={formData.productModel} onChange={e => setFormData({...formData, productModel: e.target.value})} className="rounded-3xl" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Custom Product</label>
                           <GlassInput placeholder="Optional" value={formData.customProductName || ''} onChange={e => setFormData({...formData, customProductName: e.target.value})} className="rounded-3xl" />
                       </div>
                   </div>

                   <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Issue Type</label>
                       <select className="w-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 rounded-3xl px-4 py-3 outline-none text-zinc-800 dark:text-white shadow-sm text-sm font-bold" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value as any})}>
                           <option value="Installation" className="text-black">Installation</option>
                           <option value="Complaint" className="text-black">Complaint</option>
                           <option value="Store Stock" className="text-black">Store Stock</option>
                           <option value="Store Stack" className="text-black">Store Stack</option>
                       </select>
                   </div>

                   <GlassButton type="submit" className="w-full mt-4 rounded-3xl py-4 text-lg shadow-lg shadow-blue-500/10">
                       Save & Proceed
                   </GlassButton>
               </GlassCard>
           </form>
       ) : (
           <div className="space-y-4 animate-in slide-in-from-left-4">
               {complaints.length === 0 && (
                   <div className="text-center py-20 bg-white/20 dark:bg-white/5 rounded-3xl border border-dashed border-white/30">
                       <ClipboardList className="mx-auto text-zinc-400 mb-2" size={40} />
                       <p className="text-zinc-500 font-medium">No tickets raised yet.</p>
                   </div>
               )}
               {complaints.sort((a,b) => b.date.localeCompare(a.date)).map(c => (
                   <GlassCard key={c.id} className="p-4 relative overflow-hidden group rounded-3xl border border-white/40 dark:border-white/10">
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${c.isResolved ? 'bg-green-500' : 'bg-red-500'}`} />
                       <div className="pl-3 flex justify-between items-start">
                           <div className="space-y-1">
                               <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-[9px] px-2 py-0.5 rounded-3xl border font-black uppercase tracking-widest ${c.issueType === 'Installation' ? 'bg-blue-100/50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : (c.issueType === 'Store Stock' || c.issueType === 'Store Stack') ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-orange-100/50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300'}`}>{c.issueType}</span>
                                   <span className="text-[10px] font-bold text-zinc-400 ml-1">{formatToDisplayDate(c.date)}</span>
                               </div>
                               <h4 className="font-bold text-lg text-zinc-800 dark:text-white">{c.customerName}</h4>
                               <div className="flex items-center gap-2 text-zinc-500">
                                   <Package size={14} />
                                   <p className="text-sm font-medium">{c.productModel} {c.customProductName ? `(${c.customProductName})` : ''}</p>
                               </div>
                               <div className="flex items-center gap-3 mt-1">
                                   <a href={`tel:${c.phoneNumber}`} className="text-sm text-blue-500 font-bold flex items-center gap-1.5 hover:underline">
                                       <Phone size={14} /> {c.phoneNumber}
                                   </a>
                                   <div className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-1" />
                                   {user.tollFreeNumber && (
                                       <button onClick={() => window.location.href = `tel:${user.tollFreeNumber}`} className="text-zinc-400 hover:text-emerald-500 transition-colors" title="Call Service Center">
                                           <Phone size={14} />
                                       </button>
                                   )}
                                   {user.brandSiteUrl && (
                                       <button onClick={() => window.open(user.brandSiteUrl, '_blank')} className="text-zinc-400 hover:text-blue-500 transition-colors" title="Registration Page">
                                           <Globe size={14} />
                                       </button>
                                   )}
                               </div>
                           </div>
                           <button onClick={() => toggleStatus(c)} className={`p-3 rounded-3xl transition-all ${c.isResolved ? 'text-green-500 bg-green-50 dark:bg-green-900/20 shadow-inner' : 'text-zinc-300 bg-zinc-100 dark:bg-zinc-800'}`}>
                               {c.isResolved ? <CheckCircle size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />}
                           </button>
                       </div>
                   </GlassCard>
               ))}
           </div>
       )}

        <Modal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); setView('history'); }} title="Ticket Created Successfully">
            <div className="space-y-6 text-center py-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 mb-2 border border-green-500/20">
                    <CheckCircle size={40} />
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-bold">Progress Saved!</p>
                    <p className="text-sm text-zinc-500">What would you like to do next for this customer?</p>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-2">
                    {user.brandSiteUrl && (
                        <GlassButton onClick={() => handleRedirect('site')} className="w-full rounded-3xl flex items-center justify-center gap-3 py-4 bg-blue-600 text-white border-blue-500">
                            <Globe size={20} /> Open Brand Site
                        </GlassButton>
                    )}
                    {user.tollFreeNumber && (
                        <GlassButton onClick={() => handleRedirect('call')} className="w-full rounded-3xl flex items-center justify-center gap-3 py-4 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-white border-zinc-200 dark:border-zinc-700" variant="secondary">
                            <Phone size={20} /> Call Toll Free
                        </GlassButton>
                    )}
                    <GlassButton onClick={() => { setShowSuccessModal(false); setView('history'); }} variant="secondary" className="w-full rounded-3xl py-3 text-zinc-500">
                        Dismiss
                    </GlassButton>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default CRM;
