'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Combine, Plus } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

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

type Branch = { id: string; name: unknown };
type Table = { id: string; name: unknown; branch_id?: string };

export default function TableMergesPage() {
  const [items, setItems] = useState<MergeRow[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [branchId, setBranchId] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/table-merges');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    api.get('/branches').then((r) => setBranches(r.data.body || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!branchId) {
      setTables([]);
      return;
    }
    api.get('/tables', { params: { branch_id: branchId } }).then((r) => setTables(r.data.body || [])).catch(console.error);
  }, [branchId]);

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (members.length < 2) return;
    setSaving(true);
    try {
      await api.post('/table-merges', { branch_id: branchId, members, type: 'manual' });
      setOpen(false);
      setMembers([]);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Table Merges"
        icon={<Combine className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create merge
          </button>
        }
      >
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

      <Modal
        open={open}
        title="Create table merge"
        onClose={() => setOpen(false)}
        footer={
          <FormActions formId="merge-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />
        }
      >
        <form id="merge-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Branch">
            <select
              className={fieldClass}
              required
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setMembers([]);
              }}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Tables (select 2 or more)">
            <select
              className={fieldClass}
              multiple
              value={members}
              onChange={(e) => setMembers(Array.from(e.target.selectedOptions, (o) => o.value))}
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{labelOf(t.name)}</option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>
    </>
  );
}
