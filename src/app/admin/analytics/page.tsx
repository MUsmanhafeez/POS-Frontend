'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Insights = {
  top_sellers?: Array<{ item: string; qty: number; revenue?: number }>;
  demand_forecast?: Array<{ item: string; forecast_qty: number; last_week_qty?: number }>;
  waste_risk?: Array<{ item: string; risk: string; inventory_qty?: number }>;
  fraud_signal?: { void_rate_pct?: number; score?: number; level?: string; flagged_cashiers?: unknown[] };
  payment_mix?: Array<{ method: string; total: number; txn_count?: number }>;
  sales_7d?: { total: number; orders: number };
};

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [snapshotMsg, setSnapshotMsg] = useState('');

  async function load() {
    const { data } = await api.get('/analytics/insights');
    setInsights(data.body);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function ask(e: FormEvent) {
    e.preventDefault();
    const { data } = await api.post('/analytics/ask', { question });
    setAnswer(data.body?.answer || 'No answer');
  }

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
            <p className="text-sm text-muted">SQL-based forecasts, waste risk, and fraud signals (no external AI).</p>
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

      <Card className="p-4">
        <h2 className="mb-3 font-bold">Ask ERP</h2>
        <form onSubmit={ask} className="flex flex-wrap gap-2">
          <input
            className={`${fieldClass} min-w-[240px] flex-1`}
            placeholder="e.g. top sellers, void rate, payment mix"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="submit" className={btnPrimary}>Ask</button>
        </form>
        {answer ? <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm">{answer}</p> : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Demand forecast</h2>
          <ul className="space-y-2 text-sm">
            {(insights?.demand_forecast || []).slice(0, 10).map((r) => (
              <li key={r.item} className="flex justify-between border-b border-border py-1">
                <span>{r.item}</span>
                <span className="font-semibold">~{r.forecast_qty}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Waste risk</h2>
          <ul className="space-y-2 text-sm">
            {(insights?.waste_risk || []).map((r) => (
              <li key={r.item} className="flex justify-between border-b border-border py-1">
                <span>{r.item}</span>
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
              <li key={r.item} className="flex justify-between border-b border-border py-1">
                <span>{r.item}</span>
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
