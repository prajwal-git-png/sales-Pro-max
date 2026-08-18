import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, ExternalLink } from 'lucide-react';
import { GlassButton, Modal } from './ui/GlassComponents';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  useEffect(() => {
    // Check if in iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check if running in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (onShowGuide?: () => void) => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
        if (onShowGuide) onShowGuide();
      }
    } else {
      if (onShowGuide) onShowGuide();
    }
  };

  return {
    deferredPrompt,
    isInstallable: !!deferredPrompt || isIOS || !isInstalled,
    isInstalled,
    isIOS,
    isInIframe,
    triggerInstall,
  };
};

export const InstallBanner: React.FC = () => {
  const { isInstalled, isIOS, isInIframe, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already standalone or user closed banner this session
  if (isInstalled || dismissed) return null;

  return (
    <>
      <div id="pwa_install_banner" className="fixed top-20 left-4 right-4 z-40 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/60 dark:border-white/10 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Install SalesTrack App</p>
              <p className="text-[10px] text-zinc-400 truncate">Fast 1-tap launcher • Works offline</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => triggerInstall(() => setShowGuideModal(true))}
              className="px-3.5 py-1.5 bg-white text-zinc-950 font-bold text-xs rounded-xl shadow-sm hover:bg-zinc-100 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal for iOS, Desktop & Iframe Fallback */}
      <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} title="Install SalesTrack Application">
        <div className="space-y-4 text-zinc-800 dark:text-zinc-200">
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
              Install SalesTrack to your device home screen or desktop for full standalone app experience with offline capability.
            </p>
          </div>

          {isInIframe && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                ⚠️ Running in Embedded Preview
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Browsers disable PWA installation inside preview frames. Open the app in its own tab to install directly:
              </p>
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              >
                <ExternalLink size={14} />
                Open In Full Tab &amp; Install
              </a>
            </div>
          )}

          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">iOS Safari Installation:</p>
              <ol className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong>Share icon</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> in Safari's bottom toolbar.</span>
                </li>
                <li className="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down and select <strong>'Add to Home Screen'</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-blue-500" />.</span>
                </li>
                <li className="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Tap <strong>'Add'</strong> in top-right corner.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chrome / Edge / Android Installation:</p>
              <ol className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Look for the <strong>Install App icon</strong> (🖥️ or 📥) in your browser address bar or tap browser menu (⋮).</span>
                </li>
                <li className="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Tap <strong>'Install SalesTrack'</strong> or <strong>'Add to Home screen'</strong>.</span>
                </li>
                <li className="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Confirm by clicking <strong>'Install'</strong>. SalesTrack will appear in your apps list!</span>
                </li>
              </ol>
            </div>
          )}

          <div className="pt-2">
            <GlassButton onClick={() => setShowGuideModal(false)} className="w-full justify-center">
              Got It
            </GlassButton>
          </div>
        </div>
      </Modal>
    </>
  );
};
