'use client';

import { create } from 'zustand';
import { getPendingSyncCount } from '@/lib/offline/db';

type ConnectivityState = {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  init: () => void;
  refreshPending: () => Promise<void>;
  setSyncing: (v: boolean) => void;
};

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  pendingCount: 0,

  init: () => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      set({ online: true });
      get().refreshPending();
    };
    const onOffline = () => set({ online: false });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    set({ online: navigator.onLine });
    get().refreshPending();
  },

  refreshPending: async () => {
    try {
      const pendingCount = await getPendingSyncCount();
      set({ pendingCount });
    } catch {
      /* ignore */
    }
  },

  setSyncing: (syncing) => set({ syncing }),
}));
