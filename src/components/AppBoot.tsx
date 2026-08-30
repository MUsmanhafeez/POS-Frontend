'use client';

import { useEffect } from 'react';
import { useAppSettingsStore } from '@/stores/appSettings';

export default function AppBoot() {
  const load = useAppSettingsStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return null;
}
