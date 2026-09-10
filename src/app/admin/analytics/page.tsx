'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, labelOf } from '@/lib/ui';

type Insights = {
  top_sellers?: Array<{ item: string; qty: number; revenue?: number }>;
  demand_forecast?: Array<{ item: string; forecast_qty: number; last_week_qty?: number }>;
  waste_risk?: Array<{ item: string; risk: string; inventory_qty?: number }>;
  fraud_signal?: { void_rate_pct?: number; score?: number; level?: string; flagged_cashiers?: unknown[] };
  payment_mix?: Array<{ method: string; total: number; txn_count?: number }>;
  sales_7d?: { total: number; orders: number };
};

const PRESET_LINKS = [
  { href: '/admin/analytics/report-builder', label: 'Report Builder', desc: 'Date, time, branch, YoY filters' },
  { href: '/admin/analytics/seasonal-readiness', label: 'Seasonal Readiness', desc: 'Eid / occasion stock plan' },
  { href: '/admin/analytics/report-builder', label: 'Late night sales', desc: 'Use Late Night preset' },
  { href: '/admin/occasions', label: 'Occasion Calendar', desc: 'Manage events & ETL' },
];

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [snapshotMsg, setSnapshotMsg] = useState('');
  const [alerts, setAlerts] = useState<Array<{ name: string; days_until: number }>>([]);

  async function load() {
    const { data } = await api.get('/analytics/insights');
    setInsights(data.body);
  }

  useEffect(() => {
    load().catch(console.error);
    api.get('/analytics/occasion-alerts').then((r) => setAlerts(r.data.body?.alerts || []));
  }, []);

  async function snapshot() {
    const { data } = await api.post('/analytics/snapshot');
    setSnapshotMsg(`Snapshot saved: ${data.body?.inserted ?? 0} metrics`);
  }

  const fraud = insights?.fraud_signal || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-plum" />
          <div>
            <h1 className="text-xl font-bold">Analytics & Insights</h1>
            <p className="text-sm text-muted">SQL-based intelligence — no external AI API required.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={() => load()}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" className={btnPrimary} onClick={snapshot}>Save snapshot</button>
        </div>
      </div>
      {snapshotMsg ? <p className="text-sm text-emerald-700">{snapshotMsg}</p> : null}

      {alerts.length > 0 && (
        <Card className="border-warning/40 bg-warning-soft p-4">
          <p className="font-semibold">Occasion prep alerts</p>
          <ul className="mt-1 text-sm">
            {alerts.map((a, i) => (
              <li key={i}>{labelOf(a.name)} in {a.days_until} days — <Link href="/admin/analytics/seasonal-readiness" className="text-brand underline">view readiness</Link></li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 font-bold">Business intelligence reports</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESET_LINKS.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="rounded-xl border border-border p-3 hover:bg-surface-muted transition"
            >
              <div className="font-semibold text-brand">{p.label}</div>
              <div className="text-xs text-muted">{p.desc}</div>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase text-muted">7-day sales</div>
          <div className="mt-2 text-2xl font-bold">{insights?.sales_7d?.orders ?? '—'} orders</div>
          <div className="text-sm text-muted">Total {Number(insights?.sales_7d?.total || 0).toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase text-muted">Void rate (7d)</div>
          <div className="mt-2 text-2xl font-bold">{fraud.void_rate_pct ?? '—'}%</div>
          <div className="text-sm text-muted">Level: {fraud.level || 'normal'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase text-muted">Fraud score</div>
          <div className="mt-2 text-2xl font-bold">{fraud.score ?? '—'}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Demand forecast</h2>
          <ul className="space-y-2 text-sm">
            {(insights?.demand_forecast || []).slice(0, 10).map((r) => (
              <li key={labelOf(r.item)} className="flex justify-between border-b border-border py-1">
                <span>{labelOf(r.item)}</span>
                <span className="font-semibold">~{r.forecast_qty}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Waste risk</h2>
          <ul className="space-y-2 text-sm">
            {(insights?.waste_risk || []).map((r) => (
              <li key={labelOf(r.item)} className="flex justify-between border-b border-border py-1">
                <span>{labelOf(r.item)}</span>
                <span className="text-amber-700">{r.risk} · stock {r.inventory_qty ?? '—'}</span>
              </li>
            ))}
            {!insights?.waste_risk?.length ? <li className="text-muted">No elevated waste risk</li> : null}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Top sellers (7d)</h2>
          <ul className="space-y-2 text-sm">
            {(insights?.top_sellers || []).map((r) => (
              <li key={labelOf(r.item)} className="flex justify-between border-b border-border py-1">
                <span>{labelOf(r.item)}</span>
                <span>{r.qty}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Payment mix (30d)</h2>
          <ul className="space-y-2 text-sm">
            {(insights?.payment_mix || []).map((r) => (
              <li key={r.method} className="flex justify-between border-b border-border py-1">
                <span>{r.method}</span>
                <span>{Number(r.total).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
