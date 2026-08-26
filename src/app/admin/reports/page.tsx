'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, BarChart3, CreditCard, Ban, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Tab = 'xz' | 'items' | 'payments' | 'voids' | 'ask';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('xz');
  const [xz, setXz] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<Array<{ name: string; qty: number; revenue: number }>>([]);
  const [payments, setPayments] = useState<Array<{ method: string; total: number; txn_count: number }>>([]);
  const [activities, setActivities] = useState<Array<{ action: string; actor_name?: string; actorName?: string; created_at?: string; createdAt?: string }>>([]);
  const [type, setType] = useState<'X' | 'Z'>('X');
  const [ask, setAsk] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, b, c, d] = await Promise.all([
        api.get('/reports/xz', { params: { type } }),
        api.get('/reports/item-sales'),
        api.get('/reports/payments'),
        api.get('/activities', { params: { search: 'void', limit: 50 } }),
      ]);
      setXz(a.data.body);
      setItems(b.data.body || []);
      setPayments(c.data.body || []);
      setActivities(d.data.body || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function onAsk() {
    const { data } = await api.post('/analytics/ask', { question: ask });
    setAnswer(data.body?.answer || '');
  }

  const sales = (xz?.sales || {}) as { orders_count?: number; sales_total?: number; tax_total?: number; tip_total?: number };
  const voids = (xz?.voids || {}) as { c?: number; total?: number };

  const tabs: Array<{ id: Tab; label: string; icon: typeof FileText }> = [
    { id: 'xz', label: 'X / Z Report', icon: FileText },
    { id: 'items', label: 'Item sales', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'voids', label: 'Voids / audit', icon: Ban },
    { id: 'ask', label: 'Ask ERP', icon: MessageSquare },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-plum" />
            <h1 className="text-xl font-bold sm:text-2xl">Reports</h1>
          </div>
          <p className="mt-1 text-sm text-muted">Sales, product mix, tax, payments, and staff audit reports.</p>
        </div>
        <div className="flex gap-2">
          <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value as 'X' | 'Z')}>
            <option value="X">X Report (mid-shift)</option>
            <option value="Z">Z Report (end of day)</option>
          </select>
          <button type="button" className={btnPrimary} onClick={() => load()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                tab === t.id ? 'bg-brand text-white' : 'border border-border hover:bg-surface-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'xz' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Orders today', sales.orders_count ?? 0],
              ['Sales total', Number(sales.sales_total || 0).toFixed(2)],
              ['Tax total', Number(sales.tax_total || 0).toFixed(2)],
              ['Tips', Number(sales.tip_total || 0).toFixed(2)],
            ].map(([label, value]) => (
              <Card key={String(label)} className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
              </Card>
            ))}
          </div>
          <Card className="p-4 text-sm text-muted">
            Report type: <strong className="text-foreground">{type}</strong>
            {type === 'Z' ? ' — end-of-day close snapshot (does not reset live POS in this build).' : ' — mid-shift snapshot without reset.'}
            <div className="mt-2">
              Voids today: {voids.c ?? 0} · amount {Number(voids.total || 0).toFixed(2)}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'items' ? (
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Best sellers (last 30 days)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted">
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.name} className="border-b border-border">
                    <td className="py-2 font-medium">{i.name}</td>
                    <td className="py-2">{Number(i.qty)}</td>
                    <td className="py-2">{Number(i.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length ? <p className="py-6 text-center text-muted">No sales data yet — place POS/QR orders first.</p> : null}
          </div>
        </Card>
      ) : null}

      {tab === 'payments' ? (
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Payment method breakdown (30d)</h2>
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.method} className="flex justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className="capitalize font-medium">{p.method}</span>
                <span className="text-muted">
                  {p.txn_count} txns · {Number(p.total).toFixed(2)}
                </span>
              </li>
            ))}
            {!payments.length ? <li className="text-muted">No payments yet</li> : null}
          </ul>
        </Card>
      ) : null}

      {tab === 'voids' ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Void / refund related activity</h2>
            <Link href="/admin/activities" className="text-sm text-brand">
              Full activity log
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {activities.map((a, idx) => (
              <li key={idx} className="flex justify-between gap-2 border-b border-border py-2">
                <span>
                  <span className="font-medium">{a.action}</span>
                  <span className="text-muted"> · {a.actor_name || a.actorName || '—'}</span>
                </span>
                <span className="text-xs text-muted">{String(a.created_at || a.createdAt || '').replace('T', ' ').slice(0, 19)}</span>
              </li>
            ))}
            {!activities.length ? <li className="text-muted">No void events yet</li> : null}
          </ul>
        </Card>
      ) : null}

      {tab === 'ask' ? (
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Ask your ERP</h2>
          <p className="mb-3 text-sm text-muted">Ask about today&apos;s sales, voids, best sellers, or Z report.</p>
          <div className="flex flex-wrap gap-2">
            <input className={`${fieldClass} min-w-[240px] flex-1`} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="How are sales today?" />
            <button type="button" className={btnPrimary} onClick={onAsk}>
              Ask
            </button>
          </div>
          {answer ? <p className="mt-4 rounded-xl bg-brand-soft/40 p-3 text-sm text-foreground">{answer}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}
