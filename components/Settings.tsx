import { useState, useRef } from 'react';
import { User, Download, Database, AlertTriangle, Upload, CheckCircle2, Target, MapPin, Globe, Map as MapIcon, Save, Sun, Moon, FileSpreadsheet } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { UserProfile, StoreLocation } from '../types';
import { saveUser, compressImage, exportFullBackup, importFullBackup, BackupPackage } from '../services/storageService';
import { ReportAdjuster } from './ReportAdjuster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue using CDN URLs to avoid module resolution errors
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SettingsProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout, isDark, toggleTheme }) => {
  const [editForm, setEditForm] = useState(user);
  const [backupMonth, setBackupMonth] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<StoreLocation | undefined>(user.storeLocation);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<{
      salesCount: number;
      crmCount: number;
      eodCount: number;
      userName: string;
      date: string;
  } | null>(null);
  const [pendingBackupData, setPendingBackupData] = useState<string | null>(null);

  const LocationMarker = () => {
    useMapEvents({
        click(e) {
            setTempLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return tempLocation ? <Marker position={[tempLocation.lat, tempLocation.lng]} /> : null;
  };

  const handleSaveLocation = () => {
      if (tempLocation) {
          const updated = { ...editForm, storeLocation: tempLocation };
          setEditForm(updated);
          saveUser(updated);
          onUpdateUser(updated);
          setShowLocationModal(false);
      }
  };

  const handleSaveAll = () => {
    saveUser(editForm);
    onUpdateUser(editForm);
    alert("Settings saved successfully! ✅");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              const base64 = await compressImage(e.target.files[0]);
              const updated = { ...editForm, avatar: base64 };
              setEditForm(updated);
              saveUser(updated);
              onUpdateUser(updated);
          } catch (err) {
              alert('Image too large. Please select a smaller photo.');
          }
      }
  };

  const [isBackingUp, setIsBackingUp] = useState(false);

  const triggerFullBackup = async () => {
    try {
        setIsBackingUp(true);
        await exportFullBackup();
    } catch (e: any) {
        alert("Backup failed. " + (e.message || String(e)));
    } finally {
        setIsBackingUp(false);
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
          if (parsed.app !== 'SalesTrack') { alert("Invalid backup file."); return; }
          setRestoreSummary({ 
              salesCount: parsed.data.sales?.length || 0, 
              crmCount: parsed.data.crm?.length || 0, 
              eodCount: parsed.data.eod?.length || 0, 
              userName: parsed.data.user?.name || 'Unknown', 
              date: new Date(parsed.timestamp).toLocaleString() 
          });
          setPendingBackupData(content);
          setShowRestoreModal(true);
      } catch (err: any) { alert("Error reading file: " + err.message); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const [isRestoring, setIsRestoring] = useState(false);

  const confirmRestore = async () => {
    if (!pendingBackupData) return;
    setIsRestoring(true);
    try {
        const result = await importFullBackup(pendingBackupData);
        if (result.success) { 
            window.location.reload(); 
        } else { 
            alert(result.message); 
            setShowRestoreModal(false); 
        }
    } catch (err: any) {
        alert("Restore failed: " + (err.message || String(err)));
    } finally {
        setIsRestoring(false);
    }
  };

  const handlePrintView = async () => {
      const { getSalesWithoutImages, getSalesByMonth, getImagesForDate } = await import('../services/storageService');
      let salesToPrint = [];
      if (backupMonth) { 
          const sales = await getSalesByMonth(backupMonth); 
          // Fetch images for these sales
          salesToPrint = await Promise.all(sales.map(async (s) => {
              const images = await getImagesForDate(s.date);
              return { ...s, billImages: images };
          }));
      } else {
          salesToPrint = await getSalesWithoutImages();
      }
      
      if (salesToPrint.length === 0) { alert("No records for this period."); return; }
      salesToPrint.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const imagesHtml = salesToPrint.filter(s => (s.billImages || (s.billImage ? [s.billImage] : [])).length > 0).map(s => `<div class="bill-group" style="margin-bottom: 25px; border: 1px solid #eee; padding: 15px; border-radius: 8px; page-break-inside: avoid;"><div style="font-weight: bold; border-bottom: 1px solid #f0f0f0; margin-bottom: 10px; padding-bottom: 5px;">Date: ${s.date.split('-').reverse().join('/')}</div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">${(s.billImages || (s.billImage ? [s.billImage] : [])).map(img => `<img src="${img}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />`).join('')}</div></div>`).join('');
        printWindow.document.write(`<html><head><title>Report - ${user.name}</title><style>body { font-family: sans-serif; color: #333; padding: 30px; } h1 { color: #000; } .meta { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; } table { width: 100%; border-collapse: collapse; margin-bottom: 30px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; } th { background: #f4f4f4; } .bills-title { font-weight: bold; margin: 40px 0 20px; border-left: 5px solid #000; padding-left: 10px; }</style></head><body><h1>Sales Report</h1><div class="meta"><div><strong>${user.name}</strong> • ${user.storeName}</div><div>Period: ${backupMonth || 'Full History (Images omitted for full history)'}</div></div><table><thead><tr><th>Date</th><th>Product Details</th><th>Qty</th><th>Value</th></tr></thead><tbody>${salesToPrint.map(s => `<tr><td>${s.date.split('-').reverse().join('/')}</td><td>${s.isWeekOff ? 'WEEK OFF' : s.items.map(i => `${i.productName} (${i.quantity})`).join('<br>')}</td><td>${s.totalQty}</td><td>₹${s.totalValue.toLocaleString()}</td></tr>`).join('')}</tbody></table>${imagesHtml ? `<div class="bills-title">Attached Bills</div>${imagesHtml}` : ''}<script>window.onload = () => setTimeout(() => window.print(), 800)</script></body></html>`);
        printWindow.document.close();
      }
  };

  const [showReportAdjuster, setShowReportAdjuster] = useState(false);
  const [reportSales, setReportSales] = useState<any[]>([]);

  const handleExcelExport = async () => {
    if (!backupMonth) {
      alert("Please select a month to export.");
      return;
    }
    const { getSalesWithoutImages } = await import('../services/storageService');
    const sales = await getSalesWithoutImages();
    setReportSales(sales);
    setShowReportAdjuster(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
        {/* Profile Header */}
        <GlassCard className="p-6 text-center relative rounded-3xl">
            <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto border-4 border-white/50 dark:border-white/20 shadow-sm">
                    {editForm.avatar ? (
                        <img src={editForm.avatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-md flex items-center justify-center text-3xl font-bold text-zinc-500 dark:text-zinc-400">
                            {user.name.charAt(0)}
                        </div>
                    )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600/90 backdrop-blur-md text-white p-2 rounded-3xl cursor-pointer shadow-sm hover:scale-110 transition-transform">
                    <User size={14} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
            </div>
            <div className="space-y-1">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-zinc-500">{user.storeName}</p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider bg-green-50/50 dark:bg-green-900/30 backdrop-blur-md px-3 py-1 rounded-3xl border border-green-100/50 dark:border-green-800/50">
                <CheckCircle2 size={10} /> AI Sales Coach Online
            </div>
        </GlassCard>

        {/* Appearance Settings */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><Sun size={18} className="text-yellow-500" /> Appearance</h3>
        <GlassCard className="p-5 flex items-center justify-between rounded-3xl">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-yellow-100'}`}>
                    {isDark ? <Moon size={18} className="text-white" /> : <Sun size={18} className="text-yellow-600" />}
                </div>
                <span className="text-sm font-bold text-zinc-800 dark:text-white">Dark Mode</span>
            </div>
            <button 
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`}
            >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
                    {isDark ? <Moon size={12} className="text-zinc-800" /> : <Sun size={12} className="text-yellow-500" />}
                </div>
            </button>
        </GlassCard>

        {/* Profile & Store Settings */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><User size={18} className="text-blue-500" /> Account Settings</h3>
        <GlassCard className="p-5 space-y-4 rounded-3xl">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Executive Name</label>
                <GlassInput value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="rounded-3xl" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Store Name</label>
                <GlassInput value={editForm.storeName} onChange={e => setEditForm({...editForm, storeName: e.target.value})} className="rounded-3xl" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Employee ID</label>
                <GlassInput value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId: e.target.value})} className="rounded-3xl" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Gemini API Key</label>
                <GlassInput type="password" placeholder="Enter your Gemini API Key" value={editForm.apiKey || ''} onChange={e => setEditForm({...editForm, apiKey: e.target.value})} className="rounded-3xl" />
            </div>
        </GlassCard>

        {/* Store Location Settings */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><MapPin size={18} className="text-red-500" /> Store Location</h3>
        <GlassCard className="p-5 space-y-4 rounded-3xl">
            <p className="text-xs text-zinc-500 italic">Register your store location to enable attendance check-ins.</p>
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-3xl border border-zinc-200 dark:border-zinc-700">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Current Coordinates</p>
                    <p className="text-sm font-mono font-bold">
                        {editForm.storeLocation ? `${editForm.storeLocation.lat.toFixed(6)}, ${editForm.storeLocation.lng.toFixed(6)}` : 'Not Registered'}
                    </p>
                </div>
                <GlassButton onClick={() => setShowLocationModal(true)} variant="secondary" className="rounded-3xl h-full flex flex-col items-center gap-1 px-4">
                    <MapIcon size={20} />
                    <span className="text-[10px] font-bold uppercase">Update</span>
                </GlassButton>
            </div>
        </GlassCard>

        {/* CRM Settings */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><Globe size={18} className="text-emerald-500" /> CRM Configuration</h3>
        <GlassCard className="p-5 space-y-4 rounded-3xl">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Brand Website URL</label>
                <GlassInput placeholder="https://brand-portal.com" value={editForm.brandSiteUrl || ''} onChange={e => setEditForm({...editForm, brandSiteUrl: e.target.value})} className="rounded-3xl" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Toll Free Number</label>
                <GlassInput placeholder="1800-XXX-XXXX" value={editForm.tollFreeNumber || ''} onChange={e => setEditForm({...editForm, tollFreeNumber: e.target.value})} className="rounded-3xl" />
            </div>
        </GlassCard>

        {/* Performance Targets */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><Target size={18} className="text-orange-500" /> Performance Targets</h3>
        <GlassCard className="p-5 space-y-4 rounded-3xl">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Monthly Target (₹)</label>
                    <GlassInput type="number" value={editForm.monthlyTarget} onChange={e => setEditForm({...editForm, monthlyTarget: parseInt(e.target.value) || 0})} className="rounded-3xl" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Weekly Goal (₹)</label>
                    <GlassInput type="number" value={editForm.customTargets?.weekly || 0} onChange={e => setEditForm({...editForm, customTargets: { ...editForm.customTargets!, weekly: parseInt(e.target.value) || 0 }})} className="rounded-3xl" />
                </div>
            </div>
        </GlassCard>

        {/* Save Button */}
        <div className="px-2">
            <GlassButton onClick={handleSaveAll} className="w-full py-4 text-lg shadow-xl shadow-blue-500/20 rounded-3xl flex items-center justify-center gap-2">
                <Save size={20} /> Save All Settings
            </GlassButton>
        </div>

        {/* Data Management */}
        <h3 className="font-bold text-lg px-2 flex items-center gap-2"><Database size={18} className="text-indigo-500" /> Data & Reports</h3>
        <GlassCard className="p-5 space-y-4 rounded-3xl">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={triggerFullBackup} disabled={isBackingUp} className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-sm hover:scale-[1.02] transition-all group disabled:opacity-50 disabled:pointer-events-none">
                    {isBackingUp ? <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Download size={24} className="text-indigo-600 dark:text-indigo-400" />}
                    <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-300">{isBackingUp ? "GENERATING..." : "Backup JSON"}</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-sm hover:scale-[1.02] transition-all group">
                    <Upload size={24} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-300">Restore JSON</span>
                </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onFileChange} />
            
            <div className="pt-4 border-t border-gray-200/50 dark:border-white/10 space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Detailed Document Export</p>
                <div className="flex gap-2">
                    <input type="month" value={backupMonth} onChange={(e) => setBackupMonth(e.target.value)} className="flex-1 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/20 rounded-3xl px-4 py-2 text-sm outline-none text-zinc-800 dark:text-white" />
                    <button onClick={handlePrintView} className="px-5 bg-black/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-black rounded-3xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm">PDF</button>
                    <button onClick={handleExcelExport} className="px-4 bg-emerald-600/90 backdrop-blur-md text-white rounded-3xl active:scale-95 transition-all shadow-sm flex items-center justify-center" title="Export to Excel">
                        <FileSpreadsheet size={16} />
                    </button>
                </div>
            </div>
        </GlassCard>

        <GlassButton variant="danger" onClick={onLogout} className="w-full rounded-3xl py-4">Logout Account</GlassButton>

        {/* Modals */}
        <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Confirm Import">
            <div className="space-y-6">
                <div className="p-4 bg-amber-50/80 dark:bg-amber-900/30 backdrop-blur-md rounded-3xl border border-amber-200/50 dark:border-amber-800/50 flex gap-4">
                    <AlertTriangle size={32} className="text-amber-600 dark:text-amber-500 shrink-0" />
                    <div className="text-xs text-amber-800 dark:text-amber-200">Warning: This will overwrite all your current reports and profile data.</div>
                </div>
                {restoreSummary && (
                    <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md p-4 rounded-3xl border border-white/50 dark:border-white/20 space-y-2">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Backup File Info</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-white">Executive: {restoreSummary.userName}</p>
                        <p className="text-[11px] text-zinc-500">Date: {restoreSummary.date}</p>
                    </div>
                )}
                <div className="flex gap-3">
                    <GlassButton disabled={isRestoring} onClick={confirmRestore} className="flex-1 !bg-amber-600/90 !border-amber-500 rounded-3xl text-white disabled:opacity-50">
                        {isRestoring ? "Restoring..." : "Confirm"}
                    </GlassButton>
                    <GlassButton disabled={isRestoring} onClick={() => setShowRestoreModal(false)} variant="secondary" className="flex-1 rounded-3xl disabled:opacity-50">Cancel</GlassButton>
                </div>
            </div>
        </Modal>

        <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title="Set Store Location">
            <div className="h-[300px] w-full rounded-3xl overflow-hidden relative z-0 mb-4 border border-zinc-200 dark:border-zinc-800">
                <MapContainer center={tempLocation ? [tempLocation.lat, tempLocation.lng] : [12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker />
                </MapContainer>
                <div className="absolute bottom-2 left-2 bg-white/90 p-2 rounded-lg text-[10px] font-bold uppercase z-[400] shadow-md">Tap on map to set location</div>
            </div>
            <GlassButton onClick={handleSaveLocation} className="w-full rounded-3xl py-3">Register Location</GlassButton>
        </Modal>

        {showReportAdjuster && backupMonth && (
            <ReportAdjuster
                user={user}
                sales={reportSales}
                monthDate={new Date(parseInt(backupMonth.split('-')[0]), parseInt(backupMonth.split('-')[1]) - 1, 1)}
                onClose={() => setShowReportAdjuster(false)}
            />
        )}
    </div>
  );
};

export default Settings;
