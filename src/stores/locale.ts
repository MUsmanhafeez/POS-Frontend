'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { translate, type Locale } from '@/lib/i18n/messages';

type LocaleState = {
  locale: Locale;
  remote: Record<Locale, Record<string, string>>;
  setLocale: (locale: Locale) => void;
  loadRemote: () => Promise<void>;
  t: (key: string, fallback?: string) => string;
};

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('rtl', locale === 'ar');
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      remote: { en: {}, ar: {} },
      setLocale(locale) {
        set({ locale });
        applyDocumentLocale(locale);
        localStorage.setItem('forkiva-locale', locale);
      },
      async loadRemote() {
        try {
          const { data } = await api.get('/app/translations');
          const body = (data.body || {}) as Record<string, Record<string, string>>;
          set({
            remote: {
              en: body.en || {},
              ar: body.ar || {},
            },
          });
        } catch {
          /* offline / unauthenticated boot */
        }
      },
      t(key, fallback) {
        const { locale, remote } = get();
        const fromApi =
          remote[locale]?.[key] ||
          remote[locale]?.[`ui::${key}`] ||
          remote[locale]?.[`admin::${key}`] ||
          remote[locale]?.[`admin::sidebar.${key.toLowerCase()}`];
        if (fromApi) return fromApi;
        return translate(locale, key, fallback);
      },
    }),
    {
      name: 'forkiva-locale-store',
      partialize: (s) => ({ locale: s.locale }),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) applyDocumentLocale(state.locale);
      },
    }
  )
);

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const remote = useLocaleStore((s) => s.remote);
  return (key: string, fallback?: string) => {
    const fromApi =
      remote[locale]?.[key] ||
      remote[locale]?.[`ui::${key}`] ||
      remote[locale]?.[`admin::${key}`];
    if (fromApi) return fromApi;
    return translate(locale, key, fallback);
  };
}
