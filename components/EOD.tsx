import React, { useState, useEffect } from 'react';
import { Send, Target, TrendingUp, Calendar, Copy, Check } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';
import { generateStoreEODReport } from '../services/reportService';

interface EODProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
}

const EOD: React.FC<EODProps> = ({ user, onUpdateUser }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weeklyTarget, setWeeklyTarget] = useState(user.customTargets?.weekly || 0);
    const [achievement, setAchievement] = useState(0);
    const [eolTarget, setEolTarget] = useState(user.customTargets?.eol || 0);
    const [eolAchieve, setEolAchieve] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // Auto-calculate daily target
    const dailyTarget = Math.round(weeklyTarget / 7);

    const handleShare = () => {
        // Persist targets
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

        const reportText = generateStoreEODReport(
            user,
            date,
            dailyTarget,
            achievement,
            weeklyTarget,
            achievement, // Simplified for this view as requested
            eolTarget,
            eolAchieve
        );

        window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
        setShowSuccess(true);
    };

    const progress = dailyTarget > 0 ? Math.min((achievement / dailyTarget) * 100, 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Store EOD</h2>
                <p className="text-slate-500 text-sm">Store performance tracking</p>
            </div>

            <GlassCard className="p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/10 pb-3">
                    <Calendar size={18} className="text-blue-500" />
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="bg-transparent font-bold text-lg outline-none w-full"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Target size={14} className="text-purple-500" /> Weekly Target (₹)
                        </label>
                        <GlassInput 
                            type="number"
                            placeholder="Set your goal for the week"
                            value={weeklyTarget || ''}
                            onChange={e => setWeeklyTarget(parseInt(e.target.value) || 0)}
                        />
                        <p className="text-[10px] text-blue-500 font-bold ml-1">Daily Target (Auto): ₹{dailyTarget.toLocaleString()}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <TrendingUp size={14} className="text-green-500" /> Day Achievement (₹)
                        </label>
                        <GlassInput 
                            type="number"
                            placeholder="Enter manual store achievement"
                            value={achievement || ''}
                            onChange={e => setAchievement(parseInt(e.target.value) || 0)}
                            className="border-green-200 dark:border-green-500/30 font-bold text-xl"
                        />
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="pt-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1 px-1">
                        <span>Day Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest">EOL Tracking</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">Target</label>
                        <GlassInput 
                            type="number"
                            value={eolTarget || ''}
                            onChange={e => setEolTarget(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">Achievement</label>
                        <GlassInput 
                            type="number"
                            value={eolAchieve || ''}
                            onChange={e => setEolAchieve(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </GlassCard>

            <GlassButton onClick={handleShare} className="w-full py-4 shadow-indigo-500/20">
                <Send size={18} /> Generate & Share WhatsApp
            </GlassButton>

            <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Report Generated">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <Check size={32} />
                    </div>
                    <p className="text-sm font-medium">Store EOD report has been formatted and targets saved.</p>
                    <GlassButton onClick={() => setShowSuccess(false)} variant="secondary" className="w-full">Done</GlassButton>
                </div>
            </Modal>
        </div>
    );
};

export default EOD;