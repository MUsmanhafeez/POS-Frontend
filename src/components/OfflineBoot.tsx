'use client';

import { useEffect } from 'react';
import { useConnectivityStore } from '@/stores/connectivity';
import { startSyncEngine } from '@/lib/offline/syncEngine';

export default function OfflineBoot() {
  const init = useConnectivityStore((s) => s.init);

  useEffect(() => {
    init();
    return startSyncEngine();
  }, [init]);

  return null;
}
