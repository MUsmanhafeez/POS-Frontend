'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { btnPrimary } from '@/lib/ui';

type Row = {
  id: string;
  action: string;
  actorName?: string;
  actor_name?: string;
  entityType?: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  branchId?: string;
  branch_id?: string;
  createdAt?: string;
  created_at?: string;
  payload?: unknown;
};

export default function ActivitiesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    const { data } = await api.get('/activities', { params: { search, limit: 150 } });
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const rows = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((r) => r.action.toLowerCase().includes(filter));
  }, [items, filter]);

  return (
    <AdminListShell
      title="Activities"
      icon={<Activity className="h-5 w-5 text-plum" />}
      search={search}
      onSearch={setSearch}
      action={
        <div className="flex flex-wrap gap-2">
          {['all', 'void', 'refund', 'pin', 'branch', 'ibt', 'kds'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-2 text-xs capitalize ${filter === f ? 'bg-brand text-white' : 'border border-border'}`}
            >
              {f}
            </button>
          ))}
          <button type="button" className={btnPrimary} onClick={() => load()}>
            Refresh
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-muted">Append-only audit trail for logins, voids, refunds, PIN approvals, and config changes.</p>
      <AdminPagedTable
        rows={rows}
        emptyTitle="No activity yet"
        columns={[
          {
            key: 'when',
            header: 'When',
            render: (r) => String(r.createdAt || r.created_at || '').replace('T', ' ').slice(0, 19) || '—',
          },
          { key: 'actor', header: 'Actor', render: (r) => r.actorName || r.actor_name || '—' },
          { key: 'action', header: 'Action', render: (r) => <span className="font-medium">{r.action}</span> },
          {
            key: 'entity',
            header: 'Entity',
            render: (r) => `${r.entityType || r.entity_type || '—'} ${r.entityId || r.entity_id || ''}`.trim(),
          },
          { key: 'branch', header: 'Branch', render: (r) => r.branchId || r.branch_id || '—' },
        ]}
      />
    </AdminListShell>
  );
}
