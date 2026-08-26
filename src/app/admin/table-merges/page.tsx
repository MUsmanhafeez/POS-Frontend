'use client';

import { useEffect, useMemo, useState } from 'react';
import { Combine } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { labelOf } from '@/lib/ui';

type MergeRow = {
  id: string;
  branch?: unknown;
  created_by?: string;
  closed_by?: string;
  members?: unknown[];
  type?: string;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function TableMergesPage() {
  const [items, setItems] = useState<MergeRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/table-merges')
      .then((r) => setItems(r.data.body || []))
      .catch(console.error);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        labelOf(r.branch).toLowerCase().includes(q) ||
        String(r.created_by || '').toLowerCase().includes(q) ||
        String(r.type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <AdminListShell title="Table Merges" icon={<Combine className="h-5 w-5 text-plum" />} search={search} onSearch={setSearch}>
      <AdminPagedTable
        rows={rows}
        emptyTitle="No data available"
        columns={[
          { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
          { key: 'created_by', header: 'Created By', render: (r) => r.created_by || '—' },
          { key: 'closed_by', header: 'Closed By', render: (r) => r.closed_by || '—' },
          {
            key: 'members',
            header: 'Members',
            render: (r) => {
              const m = Array.isArray(r.members) ? r.members : [];
              return m.length ? m.map((x) => (typeof x === 'string' ? x : labelOf(x))).join(', ') : '—';
            },
          },
          { key: 'type', header: 'Type', render: (r) => r.type || '—' },
          {
            key: 'closed',
            header: 'Closed At',
            render: (r) => (r.closed_at ? String(r.closed_at).replace('T', ' ').slice(0, 19) : '—'),
          },
          {
            key: 'updated',
            header: 'Updated at',
            render: (r) => String(r.updated_at || '—').replace('T', ' ').slice(0, 19),
          },
          {
            key: 'created',
            header: 'Created at',
            render: (r) => String(r.created_at || '—').replace('T', ' ').slice(0, 19),
          },
        ]}
      />
    </AdminListShell>
  );
}
