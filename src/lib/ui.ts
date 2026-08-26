import clsx from 'clsx';

export function labelOf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, string>;
    return o.en || o.ar || Object.values(o)[0] || '';
  }
  return String(v);
}

export const fieldClass =
  'w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand-ring/40';

export const btnPrimary =
  'btn-solid inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60';

export const btnAccent =
  'btn-solid inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-brand-soft hover:border-brand/30 disabled:cursor-not-allowed disabled:opacity-60';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm font-semibold text-danger transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-muted hover:text-foreground';

export function cn(...parts: Array<string | false | null | undefined>) {
  return clsx(parts);
}

export function statusTone(active: boolean) {
  return active ? 'bg-success-soft text-success' : 'bg-surface-muted text-muted';
}

/** Rotating soft colors for cards / chips */
export const softPalette = [
  { bg: 'bg-brand-soft', text: 'text-brand', ring: 'ring-brand/20' },
  { bg: 'bg-accent-soft', text: 'text-accent', ring: 'ring-accent/20' },
  { bg: 'bg-info-soft', text: 'text-info', ring: 'ring-info/20' },
  { bg: 'bg-plum-soft', text: 'text-plum', ring: 'ring-plum/20' },
  { bg: 'bg-success-soft', text: 'text-success', ring: 'ring-success/20' },
  { bg: 'bg-warning-soft', text: 'text-warning', ring: 'ring-warning/20' },
] as const;
