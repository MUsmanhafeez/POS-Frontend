import { create } from 'zustand';
import api from '@/lib/api';
import {
  DEFAULT_APPEARANCE,
  applyTheme,
  pickAppearance,
  type AppearanceColors,
} from '@/lib/theme';

type ThemeState = {
  colors: AppearanceColors;
  loaded: boolean;
  load: () => Promise<void>;
  apply: (colors: AppearanceColors) => void;
  refreshSoftVariants: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  colors: DEFAULT_APPEARANCE,
  loaded: false,

  load: async () => {
    try {
      const { data } = await api.get('/app/settings');
      const colors = pickAppearance(data.body || {});
      get().apply(colors);
      set({ loaded: true });
    } catch {
      get().apply(DEFAULT_APPEARANCE);
      set({ loaded: true });
    }
  },

  apply: (colors) => {
    const merged: AppearanceColors = { ...DEFAULT_APPEARANCE, ...get().colors, ...colors };
    applyTheme(merged);
    set({ colors: merged });
  },

  refreshSoftVariants: () => {
    applyTheme(get().colors);
  },
}));
