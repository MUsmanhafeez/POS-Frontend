import { create } from 'zustand';
import api from '@/lib/api';

const DEFAULT_APP_NAME = 'Forkiva';

type AppSettingsState = {
  appName: string;
  loaded: boolean;
  load: () => Promise<void>;
  setAppName: (name: string) => void;
};

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  appName: DEFAULT_APP_NAME,
  loaded: false,

  load: async () => {
    try {
      const { data } = await api.get('/app/settings');
      const name = String(data.body?.app_name || DEFAULT_APP_NAME).trim() || DEFAULT_APP_NAME;
      set({ appName: name, loaded: true });
      if (typeof document !== 'undefined') document.title = name;
    } catch {
      set({ loaded: true });
    }
  },

  setAppName: (name) => {
    const trimmed = name.trim() || DEFAULT_APP_NAME;
    set({ appName: trimmed });
    if (typeof document !== 'undefined') document.title = trimmed;
  },
}));

export function appInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'F';
}
