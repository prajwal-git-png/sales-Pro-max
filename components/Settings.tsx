import React, { useState, useRef } from 'react';
import { User, LogOut, Download, Database, AlertTriangle, Info, Upload, CheckCircle2, Target } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser, getSales, compressImage, exportFullBackup, importFullBackup, BackupPackage } from '../services/storageService';
import { downloadCSV } from '../services/reportService';

interface SettingsProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user);
  const [backupMonth, setBackupMonth] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<{
      salesCount: number;
      crmCount: number;
      eodCount: number;
      userName: string;
      date: string;
  } | null>(null);
  const [pendingBackupData, setPendingBackupData] = useState<string | null>(null);

  const handleSave = () => {
    saveUser(editForm);
    onUpdateUser(editForm);
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              const base64 = await compressImage(e.target.files[0]);
              setEditForm(prev => ({ ...prev, avatar: base64 }));
          } catch (err) {
              alert('Image too large. Please select a smaller photo.');
          }
      }
  };

  const triggerFullBackup = () => {
    try {
        const data = exportFullBackup();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `SalesTrack_Backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Backup failed. Check if local storage is accessible.");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content) as BackupPackage;
          
          if (parsed.app !== 'SalesTrack') {
              alert("Not a valid SalesTrack backup file.");
              return;
          }

          setRestoreSummary({
              salesCount: parsed.data.sales.length,
              crmCount: parsed.data.crm.length,
              eodCount: parsed.data.eod.length,
              userName: parsed.data.user?.name || 'Unknown',
              date: new Date(parsed.timestamp).toLocaleString()
          });
          setPendingBackupData(content);
          setShowRestoreModal(true);
      } catch (err) {
          alert("Error reading file.");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (!pendingBackupData) return;
    const result = importFullBackup(pendingBackupData);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.message);
      setShowRestoreModal(false);
    }
  };

  const handlePrintView = () => {
      const allSales = getSales();
      let salesToPrint = allSales;
      if (backupMonth) {
          salesToPrint = allSales.filter(s => s.date.startsWith(backupMonth));
      }
      if (salesToPrint.length === 0) {
          alert("No records for this period.");
          return;
      }

      salesToPrint.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const imagesHtml = salesToPrint
            .filter(s => (s.billImages || (s.billImage ? [s.billImage] : [])).length > 0)
            .map(s => `
                <div class="bill-group" style="margin-bottom: 25px; border: 1px solid #eee; padding: 15px; border-radius: 8px; page-break-inside: avoid;">
                    <div style="font-weight: bold; border-bottom: 1px solid #f0f0f0; margin-bottom: 10px; padding-bottom: 5px;">Date: ${s.date.split('-').reverse().join('/')}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${(s.billImages || (s.billImage ? [s.billImage] : [])).map(img => `
                            <img src="${img}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
                        `).join('')}
                    </div>
                </div>
            `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Sales Report - ${user.name}</title>
                    <style>
                        body { font-family: sans-serif; color: #333; line-height: 1.4; padding: 30px; }
                        h1 { color: #000; margin-bottom: 5px; }
                        .meta { margin-bottom: 20px; font-size: 14px; color: #666; display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                        th { background: #f4f4f4; text-transform: uppercase; }
                        .bills-title { margin: 40px 0 20px; font-size: 18px; font-weight: bold; border-left: 5px solid #000; padding-left: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Sales Executive Report</h1>
                    <div class="meta">
                        <div><strong>${user.name}</strong> • ${user.storeName}</div>
                        <div>Period: ${backupMonth || 'Full History'}</div>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Product Details</th><th>Qty</th><th>Value</th></tr>
                        </thead>
                        <tbody>
                            ${salesToPrint.map(s => `
                                <tr>
                                    <td>${s.date.split('-').reverse().join('/')}</td>
                                    <td>${s.isWeekOff ? 'WEEK OFF' : s.items.map(i => `${i.productName} (${i.quantity})`).join('<br>')}</td>
                                    <td>${s.totalQty}</td>
                                    <td>₹${s.totalValue.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${imagesHtml ? `<div class="bills-title">Attached Bill Copies</div>${imagesHtml}` : ''}
                    <script>window.onload = () => { setTimeout(() => window.print(), 800); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <GlassCard className="p-6 text-center relative">
            <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-white shadow-xl">
                    {editForm.avatar ? <img src={editForm.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-400">{user.name.charAt(0)}</div>}
                </div>
                {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <User size={14} /><input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                )}
            </div>
            
            {isEditing ? (
                <div className="space-y-4 text-left">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Executive Name</label>
                        <GlassInput value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Store</label>
                        <GlassInput value={editForm.storeName} onChange={e => setEditForm({...editForm, storeName: e.target.value})} />
                    </div>
                    
                    <div className="pt-2 border-t border-dashed border-gray-200 dark:border-white/10 mt-2 space-y-3">
                         <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Target size={14} /> Performance Targets (₹)
                         </h4>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Monthly Total</label>
                                <GlassInput type="number" value={editForm.monthlyTarget} onChange={e => setEditForm({...editForm, monthlyTarget: parseInt(e.target.value) || 0})} className="h-10 text-sm" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Weekly Goal</label>
                                <GlassInput type="number" value={editForm.customTargets?.weekly || 0} onChange={e => setEditForm({...editForm, customTargets: { ...editForm.customTargets!, weekly: parseInt(e.target.value) || 0 }})} className="h-10 text-sm" />
                             </div>
                             <div className="space-y-1 col-span-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">EOL Specific Target</label>
                                <GlassInput type="number" value={editForm.customTargets?.eol || 0} onChange={e => setEditForm({...editForm, customTargets: { ...editForm.customTargets!, eol: parseInt(e.target.value) || 0 }})} className="h-10 text-sm" />
                             </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <GlassButton onClick={handleSave} className="w-full">Save Changes</GlassButton>
                        <GlassButton onClick={() => { setIsEditing(false); setEditForm(user); }} variant="secondary" className="w-full">Cancel</GlassButton>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-sm text-slate-500">{user.storeName}</p>
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-4 py-1.5 rounded-full transition-all">Update Profile & Targets</button>
                        <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full border border-green-100">
                             <CheckCircle2 size={10} /> AI Sales Coach Online
                        </div>
                    </div>
                </>
            )}
        </GlassCard>

        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><Database size={18} className="text-indigo-500" /> Data & Reports</h3>
        
        <GlassCard className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={triggerFullBackup} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 shadow-sm hover:scale-[1.02] transition-all group">
                    <Download size={24} className="text-indigo-600" /><span className="text-[10px] font-black uppercase">Backup JSON</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 shadow-sm hover:scale-[1.02] transition-all group">
                    <Upload size={24} className="text-amber-600" /><span className="text-[10px] font-black uppercase">Restore JSON</span>
                </button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onFileChange} />

            <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Document Export</p>
                <div className="flex gap-2">
                    <input type="month" value={backupMonth} onChange={(e) => setBackupMonth(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                    <button onClick={handlePrintView} className="px-5 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Generate PDF</button>
                </div>
            </div>
        </GlassCard>

        <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Confirm Import">
            <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                    <AlertTriangle size={32} className="text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-800">Warning: This will overwrite all your current reports and profile data.</div>
                </div>
                {restoreSummary && (
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Backup File Info</p>
                        <p className="text-sm font-bold">Executive: {restoreSummary.userName}</p>
                        <p className="text-[11px] text-slate-500">Date: {restoreSummary.date}</p>
                    </div>
                )}
                <div className="flex gap-3">
                    <GlassButton onClick={confirmRestore} className="flex-1 !bg-amber-600 !border-amber-400">Confirm & Restore</GlassButton>
                    <GlassButton onClick={() => setShowRestoreModal(false)} variant="secondary" className="flex-1">Cancel</GlassButton>
                </div>
            </div>
        </Modal>

        <GlassButton variant="danger" onClick={onLogout} className="w-full">Logout Account</GlassButton>
    </div>
  );
};

export default Settings;