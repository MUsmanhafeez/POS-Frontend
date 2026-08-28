export type AppearanceColors = {
  primary_color?: string;
  secondary_color?: string;
  success_color?: string;
  info_color?: string;
  warning_color?: string;
  error_color?: string;
  theme_mode?: string;
};

export const DEFAULT_APPEARANCE: Required<Omit<AppearanceColors, 'theme_mode'>> & { theme_mode: string } = {
  primary_color: '#714B67',
  secondary_color: '#00A09D',
  success_color: '#24A148',
  info_color: '#007BFF',
  warning_color: '#F1C40F',
  error_color: '#DA3E3E',
  theme_mode: 'light',
};

export function normalizeHex(hex: string, fallback: string): string {
  const h = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h;
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return fallback;
}

function hexToRgb(hex: string) {
  const n = hex.slice(1);
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function mix(hex: string, withHex: string, weight: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  return rgbToHex(a.r + (b.r - a.r) * weight, a.g + (b.g - a.g) * weight, a.b + (b.b - a.b) * weight);
}

function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const p = Math.abs(amount);
  return rgbToHex(r + (target - r) * p, g + (target - g) * p, b + (target - b) * p);
}

function isDarkMode() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

function setMetaThemeColor(color: string) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

export function resolveThemeMode(settingsMode?: string): boolean {
  if (typeof window === 'undefined') return false;
  const override = localStorage.getItem('forkiva-theme');
  if (override === 'dark' || override === 'light') {
    return override === 'dark';
  }
  const mode = settingsMode || DEFAULT_APPEARANCE.theme_mode;
  if (mode === 'dark') return true;
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return false;
}

export function applyThemeMode(settingsMode?: string, fromSettings = false) {
  if (typeof document === 'undefined') return;
  if (fromSettings) {
    localStorage.removeItem('forkiva-theme');
  }
  const dark = resolveThemeMode(fromSettings ? settingsMode : settingsMode);
  document.documentElement.classList.toggle('dark', dark);
  if (fromSettings && settingsMode) {
    localStorage.setItem('forkiva-theme', dark ? 'dark' : 'light');
  }
}

export function applyThemeColors(colors: AppearanceColors) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primary = normalizeHex(String(colors.primary_color || ''), DEFAULT_APPEARANCE.primary_color);
  const secondary = normalizeHex(String(colors.secondary_color || ''), DEFAULT_APPEARANCE.secondary_color);
  const success = normalizeHex(String(colors.success_color || ''), DEFAULT_APPEARANCE.success_color);
  const info = normalizeHex(String(colors.info_color || ''), DEFAULT_APPEARANCE.info_color);
  const warning = normalizeHex(String(colors.warning_color || ''), DEFAULT_APPEARANCE.warning_color);
  const danger = normalizeHex(String(colors.error_color || ''), DEFAULT_APPEARANCE.error_color);

  const dark = isDarkMode();
  const softBase = dark ? '#121a2b' : '#ffffff';

  root.style.setProperty('--brand', primary);
  root.style.setProperty('--brand-hover', shade(primary, -0.14));
  root.style.setProperty('--brand-soft', mix(primary, softBase, dark ? 0.78 : 0.9));
  root.style.setProperty('--brand-ring', mix(primary, '#ffffff', 0.42));
  root.style.setProperty('--plum', primary);
  root.style.setProperty('--plum-soft', mix(primary, softBase, dark ? 0.75 : 0.88));

  root.style.setProperty('--accent', secondary);
  root.style.setProperty('--accent-hover', shade(secondary, -0.14));
  root.style.setProperty('--accent-soft', mix(secondary, softBase, dark ? 0.75 : 0.88));

  root.style.setProperty('--success', success);
  root.style.setProperty('--success-soft', mix(success, softBase, dark ? 0.78 : 0.9));

  root.style.setProperty('--info', info);
  root.style.setProperty('--info-soft', mix(info, softBase, dark ? 0.78 : 0.9));

  root.style.setProperty('--warning', warning);
  root.style.setProperty('--warning-soft', mix(warning, softBase, dark ? 0.78 : 0.9));

  root.style.setProperty('--danger', danger);
  root.style.setProperty('--danger-soft', mix(danger, softBase, dark ? 0.78 : 0.9));

  setMetaThemeColor(primary);
}

export function applyTheme(colors: AppearanceColors) {
  if (typeof document === 'undefined') return;
  const { theme_mode, ...rest } = colors;
  if (theme_mode) {
    applyThemeMode(String(theme_mode), true);
  }
  applyThemeColors(rest);
}

export function pickAppearance(settings: Record<string, unknown>): AppearanceColors {
  return {
    primary_color: settings.primary_color as string | undefined,
    secondary_color: settings.secondary_color as string | undefined,
    success_color: settings.success_color as string | undefined,
    info_color: settings.info_color as string | undefined,
    warning_color: settings.warning_color as string | undefined,
    error_color: settings.error_color as string | undefined,
    theme_mode: settings.theme_mode as string | undefined,
  };
}
