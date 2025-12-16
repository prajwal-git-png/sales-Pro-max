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
    const data = JSON.stringify({ user, sales: getSales() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
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
        <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/50 transition-colors" onClick={() => downloadCSV(getSales())}>
                <FileText className="text-green-600" />
                <span className="text-sm font-medium">Export Excel</span>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/50 transition-colors" onClick={handlePrintView}>
                <Download className="text-red-500" />
                <span className="text-sm font-medium">Print PDF</span>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/50 transition-colors" onClick={exportJSON}>
                <Download className="text-blue-500" />
                <span className="text-sm font-medium">Backup Data</span>
            </GlassCard>
        </div>

        {/* Support */}
        <h3 className="font-bold text-lg px-2 mt-4">Support</h3>
        <GlassCard className="divide-y divide-white/20">
            <a href="https://wa.me/917039920000" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors">
                <span className="font-medium">WhatsApp Support</span>
                <ExternalLink size={16} className="text-slate-400" />
            </a>
            <a href="https://www.bajajelectricals.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors">
                <span className="font-medium">Bajaj Website</span>
                <ExternalLink size={16} className="text-slate-400" />
            </a>
        </GlassCard>

        <GlassButton variant="danger" onClick={onLogout} className="w-full flex items-center justify-center gap-2">
            <LogOut size={18} /> Logout
        </GlassButton>
        
        <p className="text-center text-xs text-slate-400 py-4">Version 1.0.0 • Built for Sales Executives</p>
    </div>
  );
};

export default Settings;
