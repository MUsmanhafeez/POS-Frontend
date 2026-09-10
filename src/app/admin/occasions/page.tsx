'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Occasion = {
  id: string;
  code: string;
  name: string;
  date_type: string;
  prep_lead_days: number;
  typical_duration_days: number;
  is_active: number;
  instance_count: number;
};

export default function OccasionsAdminPage() {
  const [rows, setRows] = useState<Occasion[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await api.get('/occasions');
    setRows(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function seed() {
    await api.post('/occasions/seed');
    setMsg('Pakistan occasions seeded.');
    load();
  }

  async function resolveYear() {
    const y = new Date().getFullYear();
    await api.post(`/occasions/resolve/${y}`);
    await api.post(`/occasions/resolve/${y + 1}`);
    setMsg(`Resolved instances for ${y} and ${y + 1}.`);
    load();
  }

  async function runBackfill() {
    const { data } = await api.post('/occasions/backfill-tags');
    setMsg(`Backfill: ${data.body?.updated} orders tagged.`);
  }

  async function runEtl() {
    const { data } = await api.post('/occasions/run-etl');
    setMsg(`ETL: ${data.body?.inserted} history rows.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-xl font-bold">Occasion Calendar</h1>
            <p className="text-sm text-muted">Eid, Ramadan, national events — drives seasonal intelligence.</p>
          </div>
        </div>
        <Link href="/admin/analytics" className="text-sm text-brand hover:underline">← Analytics</Link>
      </div>

      {msg && <p className="text-sm text-success">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={seed}>Seed Pakistan occasions</button>
        <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={resolveYear}>Resolve year dates</button>
        <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={runBackfill}>Backfill order tags</button>
        <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={runEtl}>Run ETL</button>
        <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={() => load()}>
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Prep lead (days)</th>
              <th className="p-3 text-left">Duration</th>
              <th className="p-3 text-left">Instances</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 text-muted">{r.code}</td>
                <td className="p-3">{r.date_type}</td>
                <td className="p-3">{r.prep_lead_days}</td>
                <td className="p-3">{r.typical_duration_days}d</td>
                <td className="p-3">{r.instance_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold mb-2">Product ↔ Ingredient mapping</h2>
        <p className="text-sm text-muted mb-2">Map menu items to inventory for stock projections.</p>
        <Link href="/admin/product-ingredients" className="text-sm text-brand hover:underline">Product ingredients</Link>
        {' · '}
        <Link href="/admin/occasions/review" className="text-sm text-brand hover:underline">Multiplier review</Link>
        {' · '}
        <Link href="/admin/occasions/import" className="text-sm text-brand hover:underline">Import history</Link>
      </Card>
    </div>
  );
}
