'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary } from '@/lib/ui';

type OutboxRow = {
  id: string;
  event_type?: string;
  eventType?: string;
  status?: string;
  attempts?: number;
  created_at?: string;
  createdAt?: string;
  device_id?: string;
  deviceId?: string;
  last_error?: string;
  lastError?: string;
  payload?: Record<string, unknown>;
};

export default function SyncPage() {
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await api.get('/sync/outbox');
    setRows(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function retry(id: string) {
    await api.post(`/sync/retry/${id}`);
    setMsg('Re-queued');
    await load();
  }

  async function flush() {
    const { data } = await api.post('/sync/flush');
    setMsg(`Processed ${data.body?.flushed ?? 0} event(s)`);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Sync outbox</h1>
          <p className="text-sm text-muted">Pending and failed sync events from POS devices with retry.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={() => load()}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" className={btnPrimary} onClick={flush}>Process pending</button>
        </div>
      </div>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-surface-muted/50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Error</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium">{r.event_type || r.eventType || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted">{r.device_id || r.deviceId || '—'}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">{r.attempts ?? 0}</td>
                <td className="px-4 py-3 text-xs">
                  {r.created_at || r.createdAt ? new Date(String(r.created_at || r.createdAt)).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-xs text-danger">
                  {r.last_error || r.lastError || '—'}
                </td>
                <td className="px-4 py-3">
                  {r.status === 'failed' ? (
                    <button type="button" className="text-xs text-brand hover:underline" onClick={() => retry(r.id)}>
                      Retry
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-6 text-center text-muted">Outbox empty</p> : null}
      </Card>
    </div>
  );
}
