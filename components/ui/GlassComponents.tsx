import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const GlassInput = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full bg-white/60 dark:bg-zinc-800/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl px-4 py-3 text-zinc-800 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all ${className}`}
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
      shadow-sm shadow-zinc-900/20 dark:shadow-white/10
      border border-zinc-800 dark:border-zinc-200
      group relative overflow-hidden
    `,
    secondary: 'bg-white/60 dark:bg-zinc-800/80 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-zinc-700/90 text-zinc-800 dark:text-white border border-white/50 dark:border-white/10',
    danger: 'bg-red-500/90 hover:bg-red-500 backdrop-blur-xl text-white shadow-md shadow-red-500/30 border border-red-400/50 dark:border-red-400/20'
  };

  return (
    <button
      className={`relative px-6 py-3 rounded-2xl font-bold active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
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
      <div className="relative w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
        <div className="p-5 border-b border-gray-200/50 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/40 shrink-0">
          <h3 className="text-xl font-bold text-zinc-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl transition-colors text-zinc-500 dark:text-zinc-400">
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