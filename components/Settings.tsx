import React, { useState, useRef } from 'react';
import { User, LogOut, FileText, Download, ExternalLink, Key, CheckCircle2, XCircle, Loader2, Upload, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser, logoutUser, getSales, compressImage, exportFullBackup, importFullBackup } from '../services/storageService';
import { downloadCSV, formatToDisplayDate } from '../services/reportService';
import { validateApiKey } from '../services/aiService';

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
  
  // API Key Validation State
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
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
              alert('Image too large');
          }
      }
  };

  const handleTestKey = async () => {
      if (!editForm.apiKey || editForm.apiKey.trim().length < 10) {
          setKeyStatus('invalid');
          return;
      }
      setKeyStatus('checking');
      const isValid = await validateApiKey(editForm.apiKey.trim());
      setKeyStatus(isValid ? 'valid' : 'invalid');
  };

  const triggerFullBackup = () => {
    const data = exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SalesTrack_FullBackup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingBackupData(content);
      setShowRestoreModal(true);
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (pendingBackupData && importFullBackup(pendingBackupData)) {
      alert("Restore successful! Application will reload.");
      window.location.reload();
    } else {
      alert("Invalid backup file. Please try a different file.");
    }
    setShowRestoreModal(false);
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
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Sales Report - ${user.name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #1e293b; background: white; }
                        .header { margin-bottom: 30px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
                        .header h1 { margin: 0 0 10px 0; color: #1e1b4b; font-size: 28px; }
                        .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px; color: #475569; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 12px; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        .bill-entry { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
                        .bill-img { width: 100%; max-width: 400px; height: auto; border-radius: 4px; }
                        @media print { .bill-img { max-width: 100%; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Sales Report</h1>
                        <div class="meta">
                            <div><strong>Executive:</strong> ${user.name} (${user.employeeId})</div>
                            <div><strong>Store:</strong> ${user.storeName}</div>
                            <div><strong>Period:</strong> ${backupMonth || 'All Time'}</div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Products</th><th>Qty</th><th>Value</th></tr>
                        </thead>
                        <tbody>
                            ${salesToPrint.map(s => `
                                <tr>
                                    <td>${s.date.split('-').reverse().join('/')}</td>
                                    <td>${s.isWeekOff ? 'Week Off' : s.items.map(i => `${i.productName} (${i.quantity}x₹${i.price})`).join('<br>')}</td>
                                    <td>${s.totalQty}</td>
                                    <td>₹${s.totalValue.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                    <label className="absolute bottom-4 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer shadow-lg">
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
                    <div className="pt-2 border-t border-dashed border-gray-300 dark:border-white/10 mt-2">
                         <label className="text-xs text-slate-500 font-bold ml-1 flex items-center gap-1"><Key size={12}/> Gemini API Key</label>
                         <div className="flex gap-2">
                             <GlassInput 
                                type="password"
                                placeholder="Paste API key" 
                                value={editForm.apiKey || ''} 
                                onChange={e => {setEditForm({...editForm, apiKey: e.target.value}); setKeyStatus('idle');}} 
                             />
                             <button onClick={handleTestKey} className="px-3 rounded-xl border bg-white/40">
                                {keyStatus === 'checking' ? <Loader2 size={18} className="animate-spin" /> : 'Test'}
                             </button>
                         </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <GlassButton onClick={handleSave} className="flex-1">Save Changes</GlassButton>
                        <GlassButton onClick={() => { setIsEditing(false); setEditForm(user); }} variant="secondary" className="flex-1">Cancel</GlassButton>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-slate-500">{user.storeName}</p>
                    <button onClick={() => setIsEditing(true)} className="text-blue-500 text-sm mt-4 font-medium hover:underline bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full">
                        Edit Profile
                    </button>
                </>
            )}
        </GlassCard>

        {/* Data Management - Unified Backup Section */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2">
            <Database size={18} className="text-indigo-500" /> System Backup
        </h3>
        <GlassCard className="p-4 space-y-4">
            <p className="text-[11px] text-slate-500 font-medium px-1">
                Save or restore your entire application state including all sales data and bill images.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={triggerFullBackup}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 hover:bg-indigo-100 transition-all shadow-sm"
                >
                    <Download size={22} />
                    <span className="text-xs font-bold">Download Backup</span>
                </button>
                <button 
                    onClick={handleRestoreClick}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200/50 hover:bg-amber-100 transition-all shadow-sm"
                >
                    <Upload size={22} />
                    <span className="text-xs font-bold">Restore Backup</span>
                </button>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={onFileChange} 
            />

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-3 px-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Export Report (Monthly)</label>
                    <FileText size={14} className="text-slate-400" />
                </div>
                <div className="flex gap-2">
                    <input 
                        type="month" 
                        value={backupMonth}
                        onChange={(e) => setBackupMonth(e.target.value)}
                        className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                    <button 
                        onClick={() => downloadCSV(getSales())} 
                        className="px-4 bg-green-500 text-white rounded-xl text-xs font-bold"
                    >
                        CSV
                    </button>
                    <button 
                        onClick={handlePrintView}
                        className="px-4 bg-red-500 text-white rounded-xl text-xs font-bold"
                    >
                        PDF
                    </button>
                </div>
            </div>
        </GlassCard>

        {/* Restore Confirmation Modal */}
        <Modal 
            isOpen={showRestoreModal} 
            onClose={() => setShowRestoreModal(false)}
            title="Confirm Restoration"
        >
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto text-amber-600">
                    <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-lg">Overwrite current data?</h4>
                    <p className="text-sm text-slate-500">
                        Restoring from a backup will replace ALL your current records, profile settings, and images. This action cannot be undone.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <GlassButton onClick={confirmRestore} className="flex-1 !bg-amber-600">
                        Yes, Restore Everything
                    </GlassButton>
                    <GlassButton onClick={() => setShowRestoreModal(false)} variant="secondary" className="flex-1">
                        Cancel
                    </GlassButton>
                </div>
            </div>
        </Modal>

        <GlassButton variant="danger" onClick={onLogout} className="w-full">
            <LogOut size={18} /> Logout
        </GlassButton>
        
        <p className="text-center text-xs text-slate-400 py-4">Version 5.3.0 • Unified Backup System</p>
    </div>
  );
};

export default Settings;