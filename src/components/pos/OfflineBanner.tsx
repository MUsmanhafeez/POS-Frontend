'use client';

import { WifiOff, CloudUpload, RefreshCw } from 'lucide-react';
import { useConnectivityStore } from '@/stores/connectivity';
import { drainSyncQueue } from '@/lib/offline/syncEngine';

export default function OfflineBanner() {
  const online = useConnectivityStore((s) => s.online);
  const syncing = useConnectivityStore((s) => s.syncing);
  const pendingCount = useConnectivityStore((s) => s.pendingCount);

  if (online && pendingCount === 0 && !syncing) return null;

  async function syncNow() {
    await drainSyncQueue(true);
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-sm font-semibold ${
        online ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-rose-200 bg-rose-50 text-rose-900'
      }`}
    >
      <div className="flex items-center gap-2">
        {online ? (
          <>
            <CloudUpload className="h-4 w-4" />
            {syncing ? 'Syncing offline sales…' : `${pendingCount} offline action(s) pending sync`}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Offline mode — sales will sync when connection returns
            {pendingCount > 0 ? ` · ${pendingCount} queued` : ''}
          </>
        )}
      </div>
      {online && pendingCount > 0 && (
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center gap-1 rounded-lg border border-current px-2 py-1 text-xs font-bold"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
          Sync now
        </button>
      )}
    </div>
  );
}
