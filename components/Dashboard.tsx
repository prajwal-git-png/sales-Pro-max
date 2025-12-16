import React, { useState, useMemo, useEffect } from 'react';
import { List, Trash2, Maximize2, X, Download, Copy, Wallet, Target, Trophy, Ban, Pencil, Check, Sparkles, Filter, Search as SearchIcon, Quote, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DailyReport, SaleItem, UserProfile } from '../types';
import { GlassCard, GlassButton, Modal } from './ui/GlassComponents';
import { generateTextReport } from '../services/reportService';
import { deleteDailyReport, updateDailyReport } from '../services/storageService';
import { getMotivationalQuote } from '../services/aiService';

interface DashboardProps {
  sales: DailyReport[];
  user: UserProfile;
  onDataChange: () => void;
}

// Helper Component for Animated Numbers
const CountUp = ({ end, prefix = '', suffix = '', duration = 1500 }: { end: number, prefix?: string, suffix?: string, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = (time - startTime) / duration;

            if (progress < 1) {
                // Ease out cubic
                const easeValue = 1 - Math.pow(1 - progress, 3);
                setCount(Math.floor(end * easeValue));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const Dashboard: React.FC<DashboardProps> = ({ sales, user, onDataChange }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDateReport, setSelectedDateReport] = useState<DailyReport | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [quote, setQuote] = useState("Loading inspiration... ✨");
  
  // Calendar Navigation State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filter State for List View
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
      productName: '',
      date: '',
      minQty: '',
      minPrice: ''
  });

  // Edit State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemState, setEditItemState] = useState<SaleItem | null>(null);
  
  // Fetch AI Quote on Mount
  useEffect(() => {
    getMotivationalQuote().then(setQuote);
  }, []);

  // Stats Calculation based on currentMonth
  const { mtdValue, mtdPercentage, balance, monthName } = useMemo(() => {
    const now = currentMonth;
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
  }, [sales, user.monthlyTarget, currentMonth]);

  // Calendar Logic based on currentMonth
  const calendarDays = useMemo(() => {
    const now = currentMonth;
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
  }, [currentMonth]);

  // Month Navigation Handlers
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const prevDate = new Date(prev);
      prevDate.setMonth(prev.getMonth() - 1);
      return prevDate;
    });
  };

  // Filtered Sales Logic
  const filteredSales = useMemo(() => {
      if (viewMode === 'calendar') return sales;

      return sales.filter(report => {
          // Date Filter
          if (filters.date && report.date !== filters.date) return false;
          
          // If product, minQty, or minPrice is set, we need to check if ANY item in the report matches
          if (filters.productName || filters.minQty || filters.minPrice) {
             const hasMatchingItem = report.items.some(item => {
                 const nameMatch = !filters.productName || item.productName.toLowerCase().includes(filters.productName.toLowerCase());
                 const qtyMatch = !filters.minQty || item.quantity >= parseInt(filters.minQty);
                 const priceMatch = !filters.minPrice || item.price >= parseFloat(filters.minPrice);
                 return nameMatch && qtyMatch && priceMatch;
             });
             if (!hasMatchingItem) return false;
          }

          return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, viewMode, filters]);

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
      a.download = `Bill_${date}_${index + 1}.jpg`;
      a.click();
  };

  const getReportImages = (report: DailyReport) => {
      return report.billImages || (report.billImage ? [report.billImage] : []);
  };

  return (
    <div className="space-y-6">
      
      {/* Daily Motivation Card */}
      <GlassCard className="p-4 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 animate-in slide-in-from-top-4 duration-500 border-l-4 border-l-yellow-400 shadow-lg">
         <div className="flex gap-3">
             <div className="bg-yellow-400/20 p-2 rounded-full h-fit">
                 <Quote className="text-yellow-600 dark:text-yellow-400" size={18} fill="currentColor" fillOpacity={0.5} />
             </div>
             <div>
                 <p className="text-sm font-semibold italic text-slate-700 dark:text-slate-200">"{quote}"</p>
                 <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">AI Daily Inspiration</p>
             </div>
         </div>
      </GlassCard>

      {/* 3 Stats Cards - with CountUp Animation */}
      <div className="grid grid-cols-3 gap-2">
          <GlassCard className="p-3 flex flex-col items-center justify-center text-center bg-blue-50/50 dark:bg-blue-900/10 animate-in zoom-in duration-500 delay-100 border-blue-100/50 dark:border-blue-500/20">
              <Target size={20} className="text-blue-500 mb-1" />
              <p className="text-[10px] uppercase text-slate-500 font-bold">Target</p>
              <p className="text-sm font-bold truncate w-full">
                  <CountUp end={user.monthlyTarget / 1000} prefix="₹" suffix="k" />
              </p>
          </GlassCard>
          <GlassCard className="p-3 flex flex-col items-center justify-center text-center bg-green-50/50 dark:bg-green-900/10 animate-in zoom-in duration-500 delay-200 border-green-100/50 dark:border-green-500/20">
              <Trophy size={20} className="text-green-500 mb-1" />
              <p className="text-[10px] uppercase text-slate-500 font-bold">Achieved</p>
              <p className="text-sm font-bold truncate w-full">
                   <CountUp end={mtdValue} prefix="₹" />
              </p>
          </GlassCard>
          <GlassCard className="p-3 flex flex-col items-center justify-center text-center bg-orange-50/50 dark:bg-orange-900/10 animate-in zoom-in duration-500 delay-300 border-orange-100/50 dark:border-orange-500/20">
              <Wallet size={20} className="text-orange-500 mb-1" />
              <p className="text-[10px] uppercase text-slate-500 font-bold">Balance</p>
              <p className="text-sm font-bold truncate w-full">
                   <CountUp end={balance} prefix="₹" />
              </p>
          </GlassCard>
      </div>

      {/* Progress & Monthly Total */}
      <GlassCard className="p-5 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-2">
             <div>
                 <h2 className="font-bold text-lg flex items-center gap-2">{monthName}</h2>
                 <p className="text-xs text-slate-500">Monthly Progress</p>
             </div>
             <p className="text-2xl font-bold text-zinc-800 dark:text-white">
                 <CountUp end={mtdValue} prefix="₹" />
             </p>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div 
                className="h-full bg-black dark:bg-white transition-all duration-1000 ease-out relative"
                style={{ width: `${mtdPercentage}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-[shine_2s_infinite]" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>0%</span>
              <span><CountUp end={mtdPercentage} suffix="%" /></span>
              <span>100%</span>
          </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="flex gap-2">
          <GlassButton onClick={handleCopyToday} className="flex-1 !py-3 bg-zinc-800 hover:bg-zinc-700 !text-sm">
             <Copy size={16} /> Copy Report
          </GlassButton>
      </div>

      {/* View Toggle */}
      <div className="flex p-1 bg-white/20 dark:bg-white/10 rounded-xl backdrop-blur-sm w-fit mx-auto">
        <button 
          onClick={() => setViewMode('calendar')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          Calendar
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          List View
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'calendar' ? (
        <GlassCard className="p-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4 px-2">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CalendarIcon size={18} className="text-blue-500" />
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
          </div>

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
                  style={{ animationDelay: `${i * 0.04}s` }} // Staggered Animation
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer transition-all border shadow-sm relative overflow-hidden animate-in zoom-in fade-in duration-300 fill-mode-backwards
                    ${isToday ? 'border-zinc-900 dark:border-white ring-2 ring-zinc-200 dark:ring-zinc-700' : 'border-transparent hover:bg-white/20'}
                    ${report ? (isWeekOff ? 'bg-gray-200 dark:bg-gray-800' : 'bg-zinc-100 dark:bg-zinc-800/80') : ''}
                  `}
                >
                  <span className={`text-xs ${isToday ? 'font-bold text-black dark:text-white' : ''}`}>{d.day}</span>
                  {report && (
                    <span className={`text-[9px] font-bold mt-0.5 ${isWeekOff ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}`}>
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
          {/* Filters Panel */}
          <div className="px-2">
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${showFilters ? 'text-black dark:text-white' : 'text-slate-500'}`}
            >
                <Filter size={16} /> Filters
            </button>
            {showFilters && (
                <GlassCard className="mt-2 p-4 animate-in slide-in-from-top-2">
                    <div className="space-y-3">
                        <div className="relative">
                            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
                                placeholder="Filter by product name..."
                                value={filters.productName}
                                onChange={e => setFilters({...filters, productName: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <input 
                                type="date"
                                className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                                value={filters.date}
                                onChange={e => setFilters({...filters, date: e.target.value})}
                            />
                            <input 
                                type="number"
                                placeholder="Min Qty"
                                className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                                value={filters.minQty}
                                onChange={e => setFilters({...filters, minQty: e.target.value})}
                            />
                             <input 
                                type="number"
                                placeholder="Min Price"
                                className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                                value={filters.minPrice}
                                onChange={e => setFilters({...filters, minPrice: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={() => setFilters({ productName: '', date: '', minQty: '', minPrice: '' })}
                                className="text-xs text-red-500 font-bold hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </GlassCard>
            )}
          </div>

          {[...filteredSales].map((report, i) => (
             <GlassCard 
                key={report.date} 
                className="p-4 animate-in slide-in-from-bottom-4 duration-500" 
                onClick={() => setSelectedDateReport(report)}
                // Stagger List animation slightly
                style={{ animationDelay: `${i * 0.05}s` }}
             >
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
                    <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-black dark:text-white">
                        <List size={16} />
                    </div>
                </div>
             </GlassCard>
          ))}
          {filteredSales.length === 0 && (
             <div className="text-center py-10 opacity-60">
                <Filter size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-slate-500 text-sm">No matching records found.</p>
             </div>
          )}
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
                <GlassButton onClick={() => copyReport(selectedDateReport)} variant="primary">
                    Copy Report
                </GlassButton>
                <GlassButton variant="danger" onClick={() => handleDeleteEntry(selectedDateReport.date)}>
                    Delete All
                </GlassButton>
             </div>
          </div>
        )}
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