import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

// Chrome/Edge fire this non-standard event when the app meets PWA
// installability criteria (manifest + service worker + HTTPS).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const ua = () => window.navigator.userAgent;

const isIos = () =>
  /iphone|ipad|ipod/i.test(ua()) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isAndroid = () => /android/i.test(ua());

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

const stepsForPlatform = (): string[] => {
  if (isIos()) {
    return [
      'Tap the Share button in Safari.',
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add" to confirm.',
    ];
  }
  if (isAndroid()) {
    return [
      'Tap the ⋮ menu in Chrome.',
      'Tap "Add to Home screen" or "Install app".',
      'Tap "Install" to confirm.',
    ];
  }
  return [
    'Open the browser menu (⋮ or ⋯).',
    'Choose "Install Sip Station" or "Save and Share → Install".',
    'You can also click the install icon in the address bar.',
  ];
};

/**
 * Floating "Install App" button. Only rendered for authenticated users
 * (see App.tsx). Triggers the native install prompt when the browser
 * offers one; otherwise shows platform-specific manual instructions.
 */
const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch {
        // Fall through to manual instructions if the prompt fails.
      }
    }
    setShowHint(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="no-print fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <Download className="h-4 w-4" />
        Install App
      </button>

      {showHint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Install Sip Station</h3>
              <button
                type="button"
                onClick={() => setShowHint(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {stepsForPlatform().map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppButton;
