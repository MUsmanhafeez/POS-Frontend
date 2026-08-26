'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

/** Logs out idle cashier sessions (security requirement). */
export default function IdleTimeoutGuard() {
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await logout();
        router.replace('/auth/login');
      }, IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [token, logout, router]);

  return null;
}
