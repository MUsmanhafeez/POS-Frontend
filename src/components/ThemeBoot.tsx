'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme';

/** Loads appearance settings and applies CSS theme variables app-wide. */
export default function ThemeBoot() {
  const load = useThemeStore((s) => s.load);
  const refreshSoftVariants = useThemeStore((s) => s.refreshSoftVariants);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => refreshSoftVariants();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [refreshSoftVariants]);

  return null;
}
