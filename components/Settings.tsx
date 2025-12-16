import React, { useState } from 'react';
import { User, LogOut, FileText, Download, ExternalLink } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser, logoutUser, getSales, compressImage } from '../services/storageService';
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

  const exportJSON = () => {
    const allSales = getSales();
    let salesToExport = allSales;
    
    if (backupMonth) {
        salesToExport = allSales.filter(s => s.date.startsWith(backupMonth));
    }
    
    if (salesToExport.length === 0) {
        alert("No data found for the selected month.");
        return;
    }

    const data = JSON.stringify({ user, sales: salesToExport }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${user.name.split(' ')[0]}_${backupMonth || 'all'}.json`;
    a.click();
  };

  const handlePrintView = () => {
      // Create a print-friendly window
      const sales = getSales();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Report</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { margin-bottom: 20px; }
                        img { max-width: 100px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Sales Report</h1>
                        <p><strong>Executive:</strong> ${user.name} (${user.employeeId})</p>
                        <p><strong>Store:</strong> ${user.storeName}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Products</th>
                                <th>Total Qty</th>
                                <th>Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.map(s => `
                                <tr>
                                    <td>${s.date}</td>
                                    <td>
                                        ${s.items.map(i => `<div>${i.productName} (${i.quantity} x ${i.price})</div>`).join('')}
                                    </td>
                                    <td>${s.totalQty}</td>
                                    <td>₹${s.totalValue}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
      }
  };

  return (
    <div className="space-y-6">
        {/* Profile Card */}
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
                <div className="space-y-3 text-left">
                    <GlassInput value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                    <GlassInput value={editForm.storeName} onChange={e => setEditForm({...editForm, storeName: e.target.value})} placeholder="Store" />
                    <GlassInput value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId: e.target.value})} placeholder="Emp ID" />
                    <div className="flex gap-2 items-center">
                        <label className="whitespace-nowrap text-sm text-slate-500 w-24">Target (₹)</label>
                        <GlassInput type="number" value={editForm.monthlyTarget} onChange={e => setEditForm({...editForm, monthlyTarget: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <GlassButton onClick={handleSave} className="flex-1">Save</GlassButton>
                        <GlassButton onClick={() => { setIsEditing(false); setEditForm(user); }} variant="secondary" className="flex-1">Cancel</GlassButton>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-slate-500">{user.storeName}</p>
                    <p className="text-xs text-slate-400 mt-1">ID: {user.employeeId}</p>
                    <button onClick={() => setIsEditing(true)} className="text-blue-500 text-sm mt-4 font-medium hover:underline">Edit Profile</button>
                </>
            )}
        </GlassCard>

        {/* Data Management */}
        <h3 className="font-bold text-lg px-2">Data & Reports</h3>
        <GlassCard className="p-4 space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Backup Month (Optional)</label>
                <input 
                    type="month" 
                    value={backupMonth}
                    onChange={(e) => setBackupMonth(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => downloadCSV(getSales())} 
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 transition-colors"
                >
                    <FileText size={20} />
                    <span className="text-xs font-bold">Export CSV</span>
                </button>
                <button 
                    onClick={handlePrintView}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 transition-colors"
                >
                    <Download size={20} />
                    <span className="text-xs font-bold">Print View</span>
                </button>
            </div>
            
            <GlassButton onClick={exportJSON} className="w-full !py-2.5 !text-sm">
                <Download size={16} /> {backupMonth ? `Backup ${backupMonth}` : 'Backup All Data'}
            </GlassButton>
        </GlassCard>

        {/* Support */}
        <h3 className="font-bold text-lg px-2 mt-2">Support</h3>
        <GlassCard className="divide-y divide-white/20">
            <a href="https://wa.me/917039920000" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <span className="font-medium">WhatsApp Support</span>
                </div>
                <ExternalLink size={16} className="text-slate-400" />
            </a>
            <a href="https://www.bajajelectricals.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </div>
                    <span className="font-medium">Bajaj Website</span>
                </div>
                <ExternalLink size={16} className="text-slate-400" />
            </a>
        </GlassCard>

        <GlassButton variant="danger" onClick={onLogout} className="w-full flex items-center justify-center gap-2">
            <LogOut size={18} /> Logout
        </GlassButton>
        
        <p className="text-center text-xs text-slate-400 py-4">Version 5.0.0 • Built for Sales Executives</p>
    </div>
  );
};

export default Settings;