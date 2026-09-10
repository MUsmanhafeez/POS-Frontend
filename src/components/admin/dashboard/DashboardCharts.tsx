'use client';

import { useMemo } from 'react';

export type ChartPoint = { label: string; value: number; secondary?: number };

function EmptyChart({ label = 'No data yet', hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/20 py-8 px-4 text-center">
      <p className="text-sm font-medium text-muted">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted/80">{hint}</p> : null}
    </div>
  );
}

export function AreaLineChart({
  data,
  height = 120,
  valueLabel = 'Sales',
  formatValue,
}: {
  data: ChartPoint[];
  height?: number;
  valueLabel?: string;
  formatValue?: (n: number) => string;
}) {
  const fmt = formatValue || ((n: number) => String(n));
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasValues = total > 0;

  const { linePoints, areaPath, dots } = useMemo(() => {
    if (!data.length || !hasValues) return { linePoints: '', areaPath: '', dots: [] as Array<{ x: number; y: number }> };

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const padX = 6;
    const padY = 8;
    const plotW = 100 - padX * 2;
    const plotH = 100 - padY * 2;

    const coords = data.map((d, i) => {
      const x = padX + (i / Math.max(data.length - 1, 1)) * plotW;
      const y = padY + (1 - d.value / maxVal) * plotH;
      return { x, y };
    });

    const line = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const bottom = padY + plotH;
    const area =
      coords.length > 0
        ? `M ${coords[0].x},${bottom} L ${coords.map((c) => `${c.x},${c.y}`).join(' L ')} L ${coords[coords.length - 1].x},${bottom} Z`
        : '';

    return { linePoints: line, areaPath: area, dots: coords };
  }, [data, hasValues]);

  if (!data.length || !hasValues) {
    return <EmptyChart hint="Complete a paid order to see the trend here." />;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted tabular-nums">
        Period total: <span className="font-semibold text-foreground">{fmt(total)}</span>
      </div>
      <div className="w-full" style={{ height }}>
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={valueLabel}>
          <defs>
            <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(13 148 136)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(13 148 136)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.33, 0.66].map((p) => (
            <line key={p} x1="6" y1={8 + p * 84} x2="94" y2={8 + p * 84} stroke="currentColor" className="text-border/60" strokeWidth="0.4" />
          ))}
          {areaPath && <path d={areaPath} fill="url(#dashAreaGrad)" />}
          {linePoints && (
            <polyline
              fill="none"
              stroke="rgb(13 148 136)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={linePoints}
            />
          )}
          {dots.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="rgb(13 148 136)" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between gap-0.5 text-[10px] font-medium text-muted">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center" title={`${d.label}: ${fmt(d.value)}`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 120,
  barClass = 'bg-brand',
  formatValue,
}: {
  data: ChartPoint[];
  height?: number;
  barClass?: string;
  formatValue?: (n: number) => string;
}) {
  const fmt = formatValue || ((n: number) => String(n));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!data.length || total <= 0) {
    return <EmptyChart hint="No paid sales recorded for today yet." />;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const barArea = height - 28;

  return (
    <div className="flex items-end justify-between gap-1" style={{ height }}>
      {data.map((d) => {
        const pct = d.value > 0 ? Math.max(8, (d.value / max) * 100) : 0;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1 min-w-0">
            {d.value > 0 ? (
              <span className="text-[9px] font-semibold text-foreground tabular-nums leading-none">{fmt(d.value)}</span>
            ) : (
              <span className="text-[9px] text-transparent">·</span>
            )}
            <div className="flex w-full max-w-[20px] items-end justify-center" style={{ height: barArea }}>
              {d.value > 0 ? (
                <div className={`w-full rounded-t-md ${barClass}`} style={{ height: `${pct}%` }} title={`${d.label}: ${fmt(d.value)}`} />
              ) : (
                <div className="h-1 w-full rounded-full bg-surface-muted" />
              )}
            </div>
            <span className="truncate text-[9px] text-muted w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ForecastBarChart({
  data,
}: {
  data: Array<{ label: string; lastWeek: number; forecast: number }>;
}) {
  if (!data.length) {
    return <EmptyChart label="No forecast yet" hint="Needs order history for same weekday." />;
  }
  const max = Math.max(...data.flatMap((d) => [d.lastWeek, d.forecast]), 1);

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-[10px] text-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-400" /> Last week</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-teal-600" /> Forecast</span>
      </div>
      <div className="space-y-2">
        {data.slice(0, 6).map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1.2fr)_1fr_1fr] items-center gap-2 text-[11px]">
            <span className="truncate font-medium text-foreground" title={row.label}>{row.label}</span>
            <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
              <div className="h-full rounded-full bg-slate-400/80" style={{ width: `${Math.max(4, (row.lastWeek / max) * 100)}%` }} />
            </div>
            <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(4, (row.forecast / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  formatValue,
  compact,
}: {
  data: ChartPoint[];
  formatValue?: (n: number) => string;
  compact?: boolean;
}) {
  const fmt = formatValue || ((n: number) => String(n));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) {
    return <EmptyChart hint="Payment breakdown appears after checkout records payments." />;
  }

  const colors = ['#0d9488', '#f97316', '#6366f1', '#ec4899', '#84cc16', '#0ea5e9'];
  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * 100;
    const seg = { ...d, pct, dash, offset, color: colors[i % colors.length] };
    offset += dash;
    return seg;
  });

  const size = compact ? 'h-24 w-24' : 'h-28 w-28';

  return (
    <div className="flex items-center gap-4">
      <div className={`relative shrink-0 ${size}`}>
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          {segments.map((s) => (
            <circle
              key={s.label}
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={s.color}
              strokeWidth="4"
              strokeDasharray={`${s.dash} ${100 - s.dash}`}
              strokeDashoffset={-s.offset}
              pathLength="100"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold text-foreground leading-tight">{fmt(total)}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 text-xs min-w-0">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate capitalize text-foreground">{s.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-muted">{Math.round(s.pct * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 56;
  const h = 24;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" points={pts} />
    </svg>
  );
}

/** Fill missing calendar days so the chart always shows a full week. */
export function buildDailySeries(
  rows: Array<{ day: string; total: number }>,
  days = 7
): ChartPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = String(r.day).slice(0, 10);
    map.set(key, Number(r.total || 0));
  }
  const out: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      value: map.get(key) ?? 0,
    });
  }
  return out;
}

/** Fill 2-hour buckets for today's hourly chart. */
export function buildHourlySeries(rows: Array<{ hour: number; total: number }>): ChartPoint[] {
  const map = new Map<number, number>();
  for (const r of rows) map.set(Number(r.hour), Number(r.total || 0));
  const out: ChartPoint[] = [];
  for (let h = 0; h < 24; h += 2) {
    const v = (map.get(h) ?? 0) + (map.get(h + 1) ?? 0);
    out.push({ label: `${String(h).padStart(2, '0')}`, value: v });
  }
  return out;
}
