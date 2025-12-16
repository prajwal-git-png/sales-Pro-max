import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl shadow-lg ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const GlassInput = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full bg-white/40 dark:bg-zinc-800/50 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all ${className}`}
    {...props}
  />
);

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const GlassButton: React.FC<GlassButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    // AI-Style: Black bg with Shiny Text (Light mode), White bg with Dark Shiny Text (Dark mode)
    primary: `
      bg-zinc-950 dark:bg-zinc-100 
      shadow-xl shadow-zinc-900/20 dark:shadow-white/10
      border border-zinc-800 dark:border-zinc-200
      group relative overflow-hidden
    `,
    secondary: 'bg-white/40 dark:bg-zinc-800 hover:bg-white/60 dark:hover:bg-zinc-700 text-slate-800 dark:text-white border border-white/20 dark:border-white/5',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white shadow-lg shadow-red-500/30 border border-white/10'
  };

  return (
    <button
      className={`relative px-6 py-3 rounded-xl font-bold active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Shiny Text Effect for Primary Button */}
      {variant === 'primary' ? (
        <span className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-zinc-400 via-white to-zinc-400 dark:from-zinc-500 dark:via-black dark:to-zinc-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">
          {children}
        </span>
      ) : (
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      )}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      {/* Updated max-height to 90dvh for better mobile support and flex column layout */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-zinc-900 border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 shrink-0">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400">
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