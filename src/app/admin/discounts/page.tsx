'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Percent, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  name: string;
  branch?: unknown;
  type?: string;
  value?: number;
  used?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function DiscountsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', branch_id: '', type: 'percent', value: '10', is_active: true });

  async function load() {
    const [d, b] = await Promise.all([
      api.get('/discounts', { params: { search } }),
      api.get('/branches'),
    ]);
    setItems(d.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/discounts', { ...form, value: Number(form.value || 0) });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Discounts"
        icon={<Percent className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', branch_id: '', type: 'percent', value: '10', is_active: true });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Discount
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'type', header: 'Type', render: (r) => <StatusBadge value={r.type} /> },
            {
              key: 'value',
              header: 'Value',
              render: (r) =>
                String(r.type || '').toLowerCase().includes('percent')
                  ? `${Number(r.value || 0)}%`
                  : `JOD ${Number(r.value || 0).toFixed(3)}`,
            },
            { key: 'used', header: 'Used', render: (r) => String(r.used ?? 0) },
            {
              key: 'activation',
              header: 'Activation',
              render: (r) => <StatusBadge value={r.is_active === false ? 'Inactive' : 'Active'} />,
            },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => String(r.created_at || '—').replace('T', ' ').slice(0, 19),
            },
            {
              key: 'updated',
              header: 'Updated at',
              render: (r) => String(r.updated_at || '—').replace('T', ' ').slice(0, 19),
            },
            { key: 'actions', header: 'Actions', render: () => <ActionsMenu /> },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title="Create Discount"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="discount-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="discount-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Branch">
            <select className={fieldClass} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Optional</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select className={fieldClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>
          </Field>
          <Field label="Value">
            <input className={fieldClass} type="number" step="0.001" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </form>
      </Modal>
    </>
  );
}
