'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/stores/locale';

/** Applies RTL/LTR and loads API translation overlays. */
export default function LocaleBoot() {
  const locale = useLocaleStore((s) => s.locale);
  const loadRemote = useLocaleStore((s) => s.loadRemote);

  useEffect(() => {
    const unsub = useLocaleStore.persist.onFinishHydration(() => {
      const loc = useLocaleStore.getState().locale;
      document.documentElement.lang = loc;
      document.documentElement.dir = loc === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.classList.toggle('rtl', loc === 'ar');
    });
    if (useLocaleStore.persist.hasHydrated()) {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.classList.toggle('rtl', locale === 'ar');
    }
    loadRemote().catch(() => undefined);
    return unsub;
  }, [locale, loadRemote]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('rtl', locale === 'ar');
  }, [locale]);

  return null;
}
