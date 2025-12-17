import React, { useState, useMemo, useEffect } from 'react';
import { Send, Target, TrendingUp, Calendar, Copy, Check, ChevronLeft, ChevronRight, List, Calendar as CalendarIcon, Trash2, X } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { UserProfile, StoreEODEntry } from '../types';
import { saveUser, getEODEntries, saveEODEntry, deleteEODEntry } from '../services/storageService';
import { generateStoreEODReport, formatToDisplayDate } from '../services/reportService';

interface EODProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
}

const EOD: React.FC<EODProps> = ({ user, onUpdateUser }) => {
    const [viewMode, setViewMode] = useState<'entry' | 'calendar'>('entry');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [achievement, setAchievement] = useState<number>(0);
    const [eolAchieve, setEolAchieve] = useState<number>(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [eodHistory, setEodHistory] = useState<StoreEODEntry[]>(getEODEntries());

    // Targets (Persistent in user profile)
    const [weeklyTarget, setWeeklyTarget] = useState(user.customTargets?.weekly || 0);
    const [eolTarget, setEolTarget] = useState(user.customTargets?.eol || 0);

    // Calendar Navigation State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Sync form when date changes or history loads
    useEffect(() => {
        const entry = eodHistory.find(e => e.date === date);
        if (entry) {
            setAchievement(entry.achievement);
            setEolAchieve(entry.eolAchieve);
            setWeeklyTarget(entry.weekTarget);
            setEolTarget(entry.eolTarget);
        } else {
            setAchievement(0);
            setEolAchieve(0);
        }
    }, [date, eodHistory]);

    // Daily target calculation
    const dailyTarget = Math.round(weeklyTarget / 7);

    // Weekly Cumulative Logic (Monday to Sunday)
    const calculateWeeklyAch = (targetDate: string) => {
        const d = new Date(targetDate);
        const day = d.getDay(); // 0 (Sun) to 6 (Sat)
        // Convert to Monday start: Mon=0, Tue=1 ... Sun=6
        const diff = (day + 6) % 7; 
        
        const monday = new Date(d);
        monday.setDate(d.getDate() - diff);
        monday.setHours(0,0,0,0);
        
        const mondayStr = monday.toISOString().split('T')[0];
        
        // Sum up achievements from history including the current input if we are on that date
        let total = eodHistory.reduce((acc, entry) => {
            if (entry.date >= mondayStr && entry.date <= targetDate) {
                return acc + entry.achievement;
            }
            return acc;
        }, 0);

        // If current date entry isn't saved yet, use form value
        const isAlreadySaved = eodHistory.some(e => e.date === targetDate);
        if (!isAlreadySaved && date === targetDate) {
            total += achievement;
        }

        return total;
    };

    const handleShare = () => {
        // Prepare EOD Entry
        const entry: StoreEODEntry = {
            date,
            achievement,
            eolAchieve,
            dayTarget: dailyTarget,
            weekTarget: weeklyTarget,
            eolTarget: eolTarget
        };

        // Save Entry
        saveEODEntry(entry);
        
        // Update targets in profile
        const updatedUser = {
            ...user,
            customTargets: {
                weekly: weeklyTarget,
                daily: dailyTarget,
                eol: eolTarget
            }
        };
        saveUser(updatedUser);
        onUpdateUser(updatedUser);
        
        // Refresh local state
        setEodHistory(getEODEntries());

        const weekAch = calculateWeeklyAch(date);
        const reportText = generateStoreEODReport(
            user,
            date,
            dailyTarget,
            achievement,
            weeklyTarget,
            weekAch,
            eolTarget,
            eolAchieve
        );

        window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
        setShowSuccess(true);
    };

    const handleDelete = (d: string) => {
        if (confirm("Delete this EOD record?")) {
            deleteEODEntry(d);
            setEodHistory(getEODEntries());
        }
    };

    // Calendar Days
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, dateStr });
        }
        return days;
    }, [currentMonth]);

    const progress = dailyTarget > 0 ? Math.min((achievement / dailyTarget) * 100, 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Store EOD</h2>
                <p className="text-slate-500 text-sm">Target vs Achievement Tracking</p>
            </div>

            {/* View Toggle */}
            <div className="flex p-1 bg-white/40 dark:bg-white/10 rounded-xl backdrop-blur-sm w-fit mx-auto border border-white/20">
                <button 
                    onClick={() => setViewMode('entry')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'entry' ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Manual Entry
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    History View
                </button>
            </div>

            {viewMode === 'entry' ? (
                <>
                    <GlassCard className="p-5 space-y-4 shadow-xl">
                        {/* Custom Date Display Overlay to force DD/MM/YYYY format */}
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/10 pb-3 relative">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 pointer-events-none">
                                <CalendarIcon size={20} />
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute inset-0 flex items-center font-bold text-lg pointer-events-none text-slate-800 dark:text-white">
                                    {formatToDisplayDate(date)}
                                </span>
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                />
                            </div>
                            <ChevronRight size={16} className="text-slate-400 transform rotate-90" />
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={14} className="text-purple-500" /> Weekly Store Target (₹)
                                </label>
                                <GlassInput 
                                    type="number"
                                    placeholder="Weekly goal"
                                    value={weeklyTarget || ''}
                                    onChange={e => setWeeklyTarget(parseInt(e.target.value) || 0)}
                                    className="font-mono"
                                />
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] text-blue-500 font-bold">Daily Target: ₹{dailyTarget.toLocaleString()}</p>
                                    <p className="text-[10px] text-purple-500 font-bold italic">Calculated for 7 days</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={14} className="text-green-500" /> Today Achievement (₹)
                                </label>
                                <GlassInput 
                                    type="number"
                                    placeholder="Achievement (₹)"
                                    value={achievement || ''}
                                    onChange={e => setAchievement(parseInt(e.target.value) || 0)}
                                    className="border-green-200 dark:border-green-500/30 font-bold text-2xl font-mono text-green-700 dark:text-green-400 h-16"
                                />
                            </div>
                        </div>

                        {/* Progress Visual */}
                        <div className="pt-4 px-1">
                            <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400 mb-2">
                                <span className="flex items-center gap-1">Today's Progress</span>
                                <span className={progress >= 100 ? 'text-green-500' : ''}>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border dark:border-white/5 shadow-inner">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${progress >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-shine" />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest">EOL REPORT</h3>
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-400">Optional</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Target</label>
                                <GlassInput 
                                    type="number"
                                    value={eolTarget || ''}
                                    onChange={e => setEolTarget(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Achieved</label>
                                <GlassInput 
                                    type="number"
                                    value={eolAchieve || ''}
                                    onChange={e => setEolAchieve(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassButton onClick={handleShare} className="w-full py-4 text-lg">
                        <Send size={20} /> Generate & Share WhatsApp
                    </GlassButton>
                </>
            ) : (
                <GlassCard className="p-4 space-y-6">
                    {/* Calendar Nav */}
                    <div className="flex items-center justify-between px-2">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth()-1)))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="font-bold text-lg">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth()+1)))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
                        ))}
                        {calendarDays.map((d, i) => {
                            if (!d) return <div key={i} />;
                            const entry = eodHistory.find(e => e.date === d.dateStr);
                            const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                            const isAchieved = entry && entry.achievement >= entry.dayTarget;

                            return (
                                <div 
                                    key={d.dateStr}
                                    onClick={() => { setDate(d.dateStr); setViewMode('entry'); }}
                                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all relative
                                        ${isToday ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}
                                        ${entry ? 'bg-white dark:bg-zinc-800 shadow-sm border-gray-100 dark:border-white/5' : 'bg-transparent'}
                                    `}
                                >
                                    <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-slate-500'}`}>{d.day}</span>
                                    {entry && (
                                        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isAchieved ? 'bg-green-500' : 'bg-blue-400'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* History List for selected month */}
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Recent Records</h4>
                        {eodHistory
                            .filter(e => e.date.startsWith(currentMonth.toISOString().slice(0, 7)))
                            .sort((a,b) => b.date.localeCompare(a.date))
                            .map(entry => (
                                <div key={entry.date} className="flex justify-between items-center p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20">
                                    <div>
                                        <p className="text-sm font-bold">{formatToDisplayDate(entry.date)}</p>
                                        <p className="text-[10px] text-slate-500">Achieved: ₹{entry.achievement.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${entry.achievement >= entry.dayTarget ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {Math.round((entry.achievement / entry.dayTarget) * 100)}%
                                        </div>
                                        <button onClick={() => handleDelete(entry.date)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </GlassCard>
            )}

            <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Success">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <Check size={32} />
                    </div>
                    <p className="text-sm font-medium">Store EOD targets and achievement updated for {formatToDisplayDate(date)}.</p>
                    <GlassButton onClick={() => setShowSuccess(false)} variant="secondary" className="w-full">Done</GlassButton>
                </div>
            </Modal>
        </div>
    );
};

export default EOD;