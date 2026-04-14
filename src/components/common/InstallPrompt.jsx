import { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

const DISMISS_KEY = 'bvi-install-prompt-dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const dismissed =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(DISMISS_KEY) === '1';

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    const handleInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      /* no-op */
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore storage errors */
    }
    setShowPrompt(false);
  };

  return (
    <>
      {showPrompt && deferredPrompt && (
        <div
          role="dialog"
          aria-label="Install BVI Labour Portal"
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white shadow-xl p-4 flex gap-3 items-start"
        >
          <div className="flex-shrink-0 rounded-md bg-[#003366] text-white p-2">
            <Download size={20} aria-hidden="true" />
          </div>
          <div className="flex-1 text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">
              Install the app
            </p>
            <p className="mb-3 leading-snug">
              Install the BVI Labour Portal app for faster access, offline
              support, and a home-screen icon.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002347] transition-colors"
              >
                <Download size={14} aria-hidden="true" />
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 z-40 bg-yellow-300/95 text-yellow-950 text-xs sm:text-sm px-4 py-1.5 flex items-center justify-center gap-2 shadow-[0_-1px_4px_rgba(0,0,0,0.08)]"
        >
          <WifiOff size={14} aria-hidden="true" />
          <span>
            You are offline — recent pages will continue to work.
          </span>
        </div>
      )}
    </>
  );
}
