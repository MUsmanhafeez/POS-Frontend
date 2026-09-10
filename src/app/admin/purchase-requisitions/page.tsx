'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary } from '@/lib/ui';

type Pr = {
  id: string;
  branch_name?: string;
  source: string;
  status: string;
  created_at: string;
};

export default function PurchaseRequisitionsPage() {
  const [rows, setRows] = useState<Pr[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  async function load() {
    const { data } = await api.get('/purchase-requisitions');
    setRows(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function open(id: string) {
    const { data } = await api.get(`/purchase-requisitions/${id}`);
    setSelected(data.body);
  }

  async function approve(id: string) {
    await api.put(`/purchase-requisitions/${id}/approve`);
    load();
    if (selected?.id === id) open(id);
  }

  async function convert(id: string) {
    const { data } = await api.post(`/purchase-requisitions/${id}/convert-to-po`);
    alert(`PO created: ${data.body?.reference_no}`);
    load();
  }

  const lines = (selected?.lines as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Purchase Requisitions</h1>
        <Link href="/admin/analytics/seasonal-readiness" className="text-sm text-brand">From seasonal forecast →</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="p-3">Branch</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{r.branch_name || '—'}</td>
                  <td className="p-3">{r.source}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">
                    <button type="button" className="text-brand text-xs" onClick={() => open(r.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          {selected ? (
            <>
              <h2 className="font-bold mb-2">Requisition {String(selected.id).slice(0, 8)}…</h2>
              <p className="text-sm text-muted mb-3">Status: {String(selected.status)}</p>
              <ul className="text-sm space-y-1 mb-4">
                {lines.map((l) => (
                  <li key={String(l.id)}>{String(l.item_name)}: {String(l.suggested_qty)} (×{String(l.multiplier)})</li>
                ))}
              </ul>
              <div className="flex gap-2">
                {selected.status === 'draft' && (
                  <button type="button" className={btnPrimary} onClick={() => approve(String(selected.id))}>Approve</button>
                )}
                {selected.status === 'approved' && (
                  <button type="button" className={btnPrimary} onClick={() => convert(String(selected.id))}>Convert to PO</button>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted text-sm">Select a requisition.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
