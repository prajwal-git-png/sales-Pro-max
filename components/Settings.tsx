import React, { useState, useRef } from 'react';
import { User, LogOut, FileText, Download, Database, AlertTriangle, Info, Upload } from 'lucide-react';
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
  
  // Restore State
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
              alert('Image processing failed.');
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
        alert("Failed to generate backup file.");
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
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
              alert("This is not a valid SalesTrack backup file.");
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
          alert("Could not read backup file. It might be corrupted.");
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
          alert("No records found to print.");
          return;
      }

      salesToPrint.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const imagesHtml = salesToPrint
            .filter(s => (s.billImages || (s.billImage ? [s.billImage] : [])).length > 0)
            .map(s => `
                <div class="bill-group">
                    <h3 class="bill-date-header">Bills for ${s.date.split('-').reverse().join('/')}</h3>
                    <div class="bill-grid">
                        ${(s.billImages || (s.billImage ? [s.billImage] : [])).map(img => `
                            <div class="bill-card">
                                <img src="${img}" class="bill-img" />
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Sales Report - ${user.name}</title>
                    <style>
                        @page { size: A4; margin: 20mm; }
                        body { font-family: -apple-system, sans-serif; padding: 0; color: #1e293b; background: white; line-height: 1.5; }
                        .header { margin-bottom: 30px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
                        .header h1 { margin: 0 0 10px 0; color: #1e1b4b; font-size: 28px; font-weight: 800; }
                        .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px; color: #475569; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 13px; table-layout: fixed; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; overflow: hidden; text-overflow: ellipsis; }
                        th { background-color: #f8fafc; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        .section-title { font-size: 18px; font-weight: 800; color: #1e1b4b; margin: 40px 0 20px 0; border-left: 4px solid #6366f1; padding-left: 10px; page-break-before: always; }
                        .bill-group { margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; page-break-inside: avoid; }
                        .bill-date-header { margin: 0 0 15px 0; font-size: 14px; font-weight: 700; color: #475569; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
                        .bill-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                        .bill-card { border: 1px solid #f1f5f9; border-radius: 8px; overflow: hidden; }
                        .bill-img { width: 100%; height: auto; max-height: 450px; object-fit: contain; display: block; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Sales Summary</h1>
                        <div class="meta">
                            <div><strong>Executive:</strong> ${user.name} (${user.employeeId})</div>
                            <div><strong>Store:</strong> ${user.storeName}</div>
                            <div><strong>Report Period:</strong> ${backupMonth || 'Cumulative History'}</div>
                            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 15%;">Date</th>
                                <th style="width: 55%;">Products</th>
                                <th style="width: 10%;">Qty</th>
                                <th style="width: 20%;">Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salesToPrint.map(s => `
                                <tr>
                                    <td>${s.date.split('-').reverse().join('/')}</td>
                                    <td>${s.isWeekOff ? '<em>Week Off</em>' : s.items.map(i => `${i.productName} (${i.quantity}x₹${i.price})`).join('<br>')}</td>
                                    <td>${s.totalQty}</td>
                                    <td>₹${s.totalValue.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${imagesHtml ? `<h2 class="section-title">Bill Attachments</h2><div class="images-container">${imagesHtml}</div>` : ''}
                    <script>window.onload = () => { setTimeout(() => { window.print(); }, 1000); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <GlassCard className="p-6 text-center relative">
            <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-white/50 shadow-xl mb-4">
                    {editForm.avatar ? (
                        <img src={editForm.avatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-400">
                            {user.name.charAt(0)}
                        </div>
                    )}
                </div>
                {isEditing && (
                    <label className="absolute bottom-4 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <User size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                )}
            </div>
            
            {isEditing ? (
                <div className="space-y-4 text-left">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-bold ml-1">Full Name</label>
                        <GlassInput value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-bold ml-1">Store Name</label>
                        <GlassInput value={editForm.storeName} onChange={e => setEditForm({...editForm, storeName: e.target.value})} placeholder="Store" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label className="whitespace-nowrap text-sm text-slate-500 w-24 font-bold">Target (₹)</label>
                        <GlassInput type="number" value={editForm.monthlyTarget} onChange={e => setEditForm({...editForm, monthlyTarget: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-dashed border-gray-300 dark:border-white/10 mt-2">
                        <GlassButton onClick={handleSave} className="flex-1">Save Changes</GlassButton>
                        <GlassButton onClick={() => { setIsEditing(false); setEditForm(user); }} variant="secondary" className="flex-1">Cancel</GlassButton>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-slate-500">{user.storeName}</p>
                    <button onClick={() => setIsEditing(true)} className="text-blue-500 text-sm mt-4 font-bold hover:underline bg-blue-50 dark:bg-blue-900/20 px-6 py-2 rounded-full transition-all">
                        Edit Profile
                    </button>
                </>
            )}
        </GlassCard>

        <h3 className="font-bold text-lg px-2 flex items-center gap-2">
            <Database size={18} className="text-indigo-500" /> Data Management
        </h3>
        
        <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/30">
                <Info size={18} className="text-blue-500 shrink-0" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Backups include your profile, sales history, and bill images. Restoring will replace all current local data.
                </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button onClick={triggerFullBackup} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Download size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">Export JSON</span>
                </button>
                <button onClick={handleRestoreClick} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">Import JSON</span>
                </button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onFileChange} />

            <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Excel / PDF Export</label>
                <div className="flex gap-2">
                    <input type="month" value={backupMonth} onChange={(e) => setBackupMonth(e.target.value)} className="flex-1 bg-slate-100 dark:bg-zinc-800/50 rounded-xl px-4 py-2 text-sm outline-none border border-transparent focus:border-indigo-500/30 transition-all" />
                    <button onClick={() => downloadCSV(getSales())} className="px-4 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">CSV</button>
                    <button onClick={handlePrintView} className="px-4 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">PDF</button>
                </div>
            </div>
        </GlassCard>

        <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Confirm Restore">
            <div className="space-y-6 pt-2">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 flex gap-4">
                    <AlertTriangle size={32} className="text-amber-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900 dark:text-amber-200">Warning</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Restoring will permanently replace all current records. This cannot be undone.</p>
                    </div>
                </div>
                {restoreSummary && (
                    <div className="space-y-3 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Summary</h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Owner</p><p className="text-sm font-bold truncate">{restoreSummary.userName}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Date</p><p className="text-[10px] font-bold">{restoreSummary.date}</p></div>
                        </div>
                    </div>
                )}
                <div className="flex gap-3 pt-4">
                    <GlassButton onClick={confirmRestore} className="flex-1 !bg-amber-600 !border-amber-400 hover:!bg-amber-700">Restore Now</GlassButton>
                    <GlassButton onClick={() => setShowRestoreModal(false)} variant="secondary" className="flex-1">Cancel</GlassButton>
                </div>
            </div>
        </Modal>

        <GlassButton variant="danger" onClick={onLogout} className="w-full py-4 text-sm uppercase tracking-widest">
            <LogOut size={18} /> Logout Session
        </GlassButton>
    </div>
  );
};

export default Settings;