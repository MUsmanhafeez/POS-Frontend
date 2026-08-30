'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { btnSecondary } from '@/lib/ui';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function PwaInstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  }

  if (hidden || !deferred) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand-soft/40 px-4 py-3">
      <div>
        <p className="text-sm font-bold text-foreground">Install POS app</p>
        <p className="text-xs text-muted">Add Forkiva to your home screen for faster launch and offline shell caching.</p>
      </div>
      <button type="button" className={btnSecondary} onClick={install}>
        <Download className="h-4 w-4" /> Install
      </button>
    </div>
  );
}
