import React, { useState, useMemo } from 'react';
import { Calendar, List, Trash2, Maximize2, X, Download, Copy, Wallet, Target, Trophy, Ban, Pencil, Check, Sparkles, Loader2 } from 'lucide-react';
import { DailyReport, SaleItem, UserProfile } from '../types';
import { GlassCard, GlassButton, Modal, GlassInput } from './ui/GlassComponents';
import { generateTextReport } from '../services/reportService';
import { deleteDailyReport, updateDailyReport } from '../services/storageService';
import { getSalesInsights } from '../services/aiService';

interface DashboardProps {
  sales: DailyReport[];
  user: UserProfile;
  onDataChange: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ sales, user, onDataChange }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDateReport, setSelectedDateReport] = useState<DailyReport | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Edit State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemState, setEditItemState] = useState<SaleItem | null>(null);
  
  // AI Coach State
  const [showCoach, setShowCoach] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachInsight, setCoachInsight] = useState('');

  // Stats Calculation
  const { mtdValue, mtdPercentage, balance, monthName } = useMemo(() => {
    const now = new Date();
    const currentMonthSales = sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const value = currentMonthSales.reduce((sum, s) => sum + s.totalValue, 0);
    const percentage = user.monthlyTarget > 0 ? Math.min((value / user.monthlyTarget) * 100, 100) : 0;
    const bal = Math.max(user.monthlyTarget - value, 0);
    return { 
        mtdValue: value, 
        mtdPercentage: percentage, 
        balance: bal,
        monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  }, [sales, user.monthlyTarget]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr });
    }
    return days;
  }, []);

  const handleDeleteEntry = (date: string) => {
    if (window.confirm('Are you sure you want to delete this report? This cannot be undone.')) {
      deleteDailyReport(date);
      setSelectedDateReport(null);
      onDataChange();
    }
  };

  const handleRemoveItem = (report: DailyReport, index: number) => {
      const updatedItems = [...report.items];
      updatedItems.splice(index, 1);
      
      if (updatedItems.length === 0) {
          handleDeleteEntry(report.date);
          return;
      }

      const totalQty = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalValue = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      const updatedReport = { ...report, items: updatedItems, totalQty, totalValue };
      updateDailyReport(report.date, updatedReport);
      setSelectedDateReport(updatedReport);
      onDataChange();
  };

  const startEditItem = (item: SaleItem, index: number) => {
      setEditingItemIndex(index);
      setEditItemState({ ...item });
  };

  const saveEditItem = (report: DailyReport, index: number) => {
      if (!editItemState) return;
      const updatedItems = [...report.items];
      updatedItems[index] = editItemState;

      const totalQty = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalValue = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      const updatedReport = { ...report, items: updatedItems, totalQty, totalValue };
      updateDailyReport(report.date, updatedReport);
      setSelectedDateReport(updatedReport);
      
      setEditingItemIndex(null);
      setEditItemState(null);
      onDataChange();
  };

  const cancelEdit = () => {
      setEditingItemIndex(null);
      setEditItemState(null);
  };

  const handleRemoveImage = (report: DailyReport, imgIndex: number) => {
      if(!confirm("Delete this image?")) return;
      const images = report.billImages || (report.billImage ? [report.billImage] : []);
      const updatedImages = images.filter((_, i) => i !== imgIndex);
      
      const updatedReport = { ...report, billImages: updatedImages, billImage: undefined };
      updateDailyReport(report.date, updatedReport);
      setSelectedDateReport(updatedReport);
      onDataChange();
  };

  const copyReport = (report: DailyReport) => {
    const text = generateTextReport(user, report);
    navigator.clipboard.writeText(text);
    alert('Report copied to clipboard!');
  };

  const handleCopyToday = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayReport = sales.find(s => s.date === todayStr);
      if(todayReport) {
          copyReport(todayReport);
      } else {
          alert('No entry found for today.');
      }
  };

  const downloadImage = (base64: string, date: string, index: number) => {
      const a = document.createElement("a");
      a.href = base64;
      // Naming convention: Bill_Date_Index
      a.download = `Bill_${date}_${index + 1}.jpg`;
      a.click();
  };

  const getReportImages = (report: DailyReport) => {
      return report.billImages || (report.billImage ? [report.billImage] : []);
  };

  const handleAICoach = async () => {
      setShowCoach(true);
      if (!coachInsight) {
          setCoachLoading(true);
          try {
              const text = await getSalesInsights(user, sales);
              setCoachInsight(text);
          } catch (e) {
              setCoachInsight("Failed to connect to AI Coach. Please check connection.");
          } finally {
              setCoachLoading(false);
          }
      }
  };

  return (
    <div className="space-y-6">
      
      {/* 3 Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
          <GlassCard className="p-3 flex flex-col items-center justify-center text-center bg-blue-50/50 dark:bg-blue-900/10">
              <Target size={20} className="text-blue-500 mb-1" />
              <p className="text-[10px] uppercase text-slate-500 font-bold">Target</p>
              <p className="text-sm font-bold truncate w-full">₹{(user.monthlyTarget / 1000).toFixed(0)}k</p>
          </GlassCard>
          <GlassCard className="p-3 flex flex-col items-center justify-center text-center bg-green-50/50 dark:bg-green-900/10">
              <Trophy size={20} className="text-green-500 mb-1" />
              <p className="text-[10px] uppercase text-slate-500 font-bold">Achieved</p>
              <p className="text-sm font-bold truncate w-full">₹{mtdValue.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="p-3 flex flex-col items-center justify-center text-center bg-orange-50/50 dark:bg-orange-900/10">
              <Wallet size={20} className="text-orange-500 mb-1" />
              <p className="text-[10px] uppercase text-slate-500 font-bold">Balance</p>
              <p className="text-sm font-bold truncate w-full">₹{balance.toLocaleString()}</p>
          </GlassCard>
      </div>

      {/* Progress & Monthly Total */}
      <GlassCard className="p-5">
          <div className="flex justify-between items-end mb-2">
             <div>
                 <h2 className="font-bold text-lg">{monthName}</h2>
                 <p className="text-xs text-slate-500">Monthly Progress</p>
             </div>
             <p className="text-2xl font-bold text-blue-600">₹{mtdValue.toLocaleString()}</p>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${mtdPercentage}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>0%</span>
              <span>{mtdPercentage.toFixed(1)}%</span>
              <span>100%</span>
          </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="flex gap-2">
          <GlassButton onClick={handleCopyToday} className="flex-1 !py-3 bg-indigo-600/90 hover:bg-indigo-600 !text-sm">
             <Copy size={16} /> Copy Report
          </GlassButton>
          <GlassButton onClick={handleAICoach} className="flex-1 !py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 !text-sm">
             <Sparkles size={16} /> AI Coach
          </GlassButton>
      </div>

      {/* View Toggle */}
      <div className="flex p-1 bg-white/20 dark:bg-white/10 rounded-xl backdrop-blur-sm w-fit mx-auto">
        <button 
          onClick={() => setViewMode('calendar')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          Calendar
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          List View
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'calendar' ? (
        <GlassCard className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((d, i) => {
              if (!d) return <div key={i} />;
              
              const report = sales.find(s => s.date === d.dateStr);
              const isToday = d.dateStr === new Date().toISOString().split('T')[0];
              const isWeekOff = report?.isWeekOff;
              
              return (
                <div 
                  key={d.dateStr}
                  onClick={() => report ? setSelectedDateReport(report) : null}
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer transition-all border shadow-sm relative overflow-hidden
                    ${isToday ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-transparent hover:bg-white/20'}
                    ${report ? (isWeekOff ? 'bg-gray-200 dark:bg-gray-800' : 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40') : ''}
                  `}
                >
                  <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : ''}`}>{d.day}</span>
                  {report && (
                    <span className={`text-[9px] font-bold mt-0.5 ${isWeekOff ? 'text-gray-500' : 'text-green-700 dark:text-green-300'}`}>
                      {isWeekOff ? 'OFF' : `${report.totalQty}u`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {[...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(report => (
             <GlassCard key={report.date} className="p-4" onClick={() => setSelectedDateReport(report)}>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold flex items-center gap-2">
                            {new Date(report.date).toLocaleDateString()}
                            {report.isWeekOff && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">OFF</span>}
                        </p>
                        <p className="text-sm text-slate-500">
                            {report.isWeekOff ? 'Week Off' : `${report.totalQty} items • ₹${report.totalValue.toLocaleString()}`}
                        </p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600">
                        <List size={16} />
                    </div>
                </div>
             </GlassCard>
          ))}
          {sales.length === 0 && <p className="text-center text-slate-500 mt-8">No records found.</p>}
        </div>
      )}

      {/* Details Modal */}
      <Modal 
        isOpen={!!selectedDateReport} 
        onClose={() => { setSelectedDateReport(null); cancelEdit(); }}
        title={selectedDateReport ? new Date(selectedDateReport.date).toDateString() : ''}
      >
        {selectedDateReport && (
          <div className="space-y-6 pb-4">
            {selectedDateReport.isWeekOff ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300">
                    <Ban size={40} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 font-medium">Marked as Week Off</p>
                </div>
            ) : (
                <>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
                        <p className="text-xs text-slate-500">Value</p>
                        <p className="font-bold text-blue-600">₹{selectedDateReport.totalValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg text-center">
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="font-bold text-purple-600">{selectedDateReport.totalQty}</p>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur py-2 z-10">Items Sold</h4>
                    {selectedDateReport.items.map((item, idx) => {
                        const isEditing = editingItemIndex === idx;

                        return (
                        <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border transition-all ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white/40 dark:bg-white/5 border-white/10'}`}>
                            {isEditing && editItemState ? (
                                <div className="w-full space-y-2">
                                    <input 
                                        className="w-full bg-transparent border-b border-blue-300 text-sm font-medium focus:outline-none"
                                        value={editItemState.productName}
                                        onChange={(e) => setEditItemState({...editItemState, productName: e.target.value})}
                                        placeholder="Product Name"
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[9px] uppercase text-slate-500 font-bold">Qty</label>
                                            <input 
                                                type="number" 
                                                className="w-full bg-transparent border-b border-blue-300 text-sm focus:outline-none"
                                                value={editItemState.quantity}
                                                onChange={(e) => setEditItemState({...editItemState, quantity: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[9px] uppercase text-slate-500 font-bold">Unit Price</label>
                                            <input 
                                                type="number" 
                                                className="w-full bg-transparent border-b border-blue-300 text-sm focus:outline-none"
                                                value={editItemState.price}
                                                onChange={(e) => setEditItemState({...editItemState, price: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={cancelEdit} className="p-1 rounded-full bg-gray-200 text-gray-600"><X size={14} /></button>
                                        <button onClick={() => saveEditItem(selectedDateReport, idx)} className="p-1 rounded-full bg-green-500 text-white"><Check size={14} /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                <div>
                                    <p className="font-medium text-sm">{item.productName}</p>
                                    <p className="text-xs text-slate-500">₹{item.price} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm mr-2">₹{item.price * item.quantity}</p>
                                    <button onClick={() => startEditItem(item, idx)} className="text-blue-400 hover:text-blue-600 p-1">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleRemoveItem(selectedDateReport, idx)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                </>
                            )}
                        </div>
                    )})}
                </div>

                {/* Bill Images */}
                {getReportImages(selectedDateReport).length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-500 mb-2 sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur py-2 z-10">Bill Copies ({getReportImages(selectedDateReport).length})</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {getReportImages(selectedDateReport).map((img, idx) => (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/20 aspect-square">
                                    <img 
                                        src={img} 
                                        alt="Bill" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                        <div className="flex gap-2">
                                            <button onClick={() => setZoomedImage(img)} className="p-2 bg-white rounded-full text-black hover:bg-gray-100">
                                                <Maximize2 size={16} />
                                            </button>
                                            <button onClick={() => downloadImage(img, selectedDateReport.date, idx)} className="p-2 bg-white rounded-full text-black hover:bg-gray-100">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                        <button onClick={() => handleRemoveImage(selectedDateReport, idx)} className="px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 mt-2">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </>
            )}

             {/* Actions */}
             <div className="grid grid-cols-2 gap-3 mt-6 sticky bottom-0 bg-white/0 pt-2">
                <GlassButton onClick={() => copyReport(selectedDateReport)}>
                    Copy Report
                </GlassButton>
                <GlassButton variant="danger" onClick={() => handleDeleteEntry(selectedDateReport.date)}>
                    Delete All
                </GlassButton>
             </div>
          </div>
        )}
      </Modal>

      {/* AI Coach Modal */}
      <Modal 
        isOpen={showCoach} 
        onClose={() => setShowCoach(false)} 
        title="AI Sales Coach"
      >
          <div className="space-y-4">
              <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Sparkles className="text-white" size={32} />
                  </div>
              </div>
              
              {coachLoading ? (
                  <div className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto text-purple-500 mb-2" size={32} />
                      <p className="text-slate-500 animate-pulse">Analyzing your sales performance...</p>
                  </div>
              ) : (
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                       {/* Simple markdown rendering */}
                       {coachInsight.split('\n').map((line, i) => (
                           <p key={i} className={`mb-2 ${line.startsWith('#') ? 'font-bold text-lg' : ''}`}>
                               {line.replace(/^#+\s/, '')}
                           </p>
                       ))}
                  </div>
              )}
              
              <GlassButton onClick={() => setShowCoach(false)} variant="secondary" className="w-full mt-4">
                  Got it, thanks!
              </GlassButton>
          </div>
      </Modal>

      {/* Image Zoom Modal */}
      {zoomedImage && (
          <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2">
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 z-50"
              >
                  <X size={24} />
              </button>
              <img 
                src={zoomedImage} 
                className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-lg"
                alt="Zoomed Bill"
              />
          </div>
      )}
    </div>
  );
};

export default Dashboard;