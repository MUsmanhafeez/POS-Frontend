'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { fieldClass, btnPrimary } from '@/lib/ui';

export default function MultiplierReviewPage() {
  const [occasions, setOccasions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [occasionId, setOccasionId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.get('/occasions').then((r) => {
      const list = r.data.body || [];
      setOccasions(list);
      if (list[0]) setOccasionId(list[0].id);
    });
  }, []);

  async function load() {
    const { data } = await api.get(`/occasions/sales-history?occasion_id=${occasionId}&year=${year}`);
    setRows(data.body || []);
  }

  async function save(id: string, value: number) {
    await api.post('/occasions/review-multiplier', { history_id: id, confirmed_multiplier: value });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Yearly multiplier review</h1>
      <Card className="p-4 flex flex-wrap gap-3">
        <select className={fieldClass} value={occasionId} onChange={(e) => setOccasionId(e.target.value)}>
          {occasions.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <input type="number" className={fieldClass} value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <button type="button" className={btnPrimary} onClick={load}>Load</button>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Multiplier</th>
              <th className="p-3">Confirmed</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t border-border">
                <td className="p-3">{String(r.item_name)}</td>
                <td className="p-3">{Number(r.multiplier).toFixed(2)}</td>
                <td className="p-3">{r.confirmed_multiplier != null ? Number(r.confirmed_multiplier).toFixed(2) : '—'}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-xs text-brand"
                    onClick={() => save(String(r.id), Number(r.multiplier))}
                  >
                    Confirm as-is
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
