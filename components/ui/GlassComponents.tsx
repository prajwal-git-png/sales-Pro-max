import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const GlassInput = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl px-5 py-4 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition-all shadow-sm ${className}`}
    {...props}
  />
);

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const GlassButton: React.FC<GlassButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md hover:shadow-lg border border-transparent',
    secondary: 'bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-zinc-700/80 text-zinc-900 dark:text-white border border-white/50 dark:border-white/10 shadow-sm',
    danger: 'bg-red-500/90 hover:bg-red-500 backdrop-blur-xl text-white shadow-sm border border-red-500/50'
  };

  return (
    <button
      className={`relative px-6 py-4 rounded-2xl font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 text-[15px]">{children}</span>
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/20 dark:bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
        <div className="p-5 border-b border-zinc-200/50 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-black/20 shrink-0">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-zinc-100/50 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 rounded-full hover:bg-zinc-200/50 dark:hover:bg-white/20 transition-colors">
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};