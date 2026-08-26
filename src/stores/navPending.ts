'use client';

import { create } from 'zustand';

type NavPendingState = {
  pending: boolean;
  href: string | null;
  start: (href: string) => void;
  done: () => void;
};

/** Instant skeleton while Next compiles / fetches the next admin page. */
export const useNavPending = create<NavPendingState>((set) => ({
  pending: false,
  href: null,
  start: (href) => set({ pending: true, href }),
  done: () => set({ pending: false, href: null }),
}));
