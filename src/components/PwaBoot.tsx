'use client';

import { useEffect } from 'react';
import api from '@/lib/api';

/** Registers service worker when PWA is enabled in settings. */
export default function PwaBoot() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    api.get('/app/settings')
      .then((res) => {
        const enabled = Boolean(res.data.body?.pwa_enabled);
        if (!enabled) return;
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  return null;
}
