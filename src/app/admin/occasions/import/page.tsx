'use client';

import { FormEvent, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

export default function ImportHistoryPage() {
  const [csv, setCsv] = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const lines = csv.trim().split('\n').slice(1);
    const rows = lines.map((line) => {
      const [date, branch_id, item_name, qty, revenue] = line.split(',').map((s) => s.trim());
      return { date, branch_id, item_name, qty: Number(qty), revenue: Number(revenue || 0) };
    }).filter((r) => r.date && r.branch_id && r.item_name);
    const { data } = await api.post('/occasions/import-history', { rows });
    setMsg(`Imported ${data.body?.inserted} rows into occasion sales history.`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Import historical sales</h1>
      <p className="text-sm text-muted">CSV columns: date, branch_id, item_name, qty, revenue (header row optional)</p>
      <Card className="p-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            className={`${fieldClass} min-h-[200px] font-mono text-xs`}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="2024-06-17,branch-id-here,Mutton Karahi,120,24000"
          />
          <button type="submit" className={btnPrimary}>Import</button>
        </form>
        {msg && <p className="mt-3 text-sm text-success">{msg}</p>}
      </Card>
    </div>
  );
}
