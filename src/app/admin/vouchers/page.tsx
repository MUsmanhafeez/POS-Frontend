'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Ticket } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  name: string;
  branch?: unknown;
  branch_id?: string;
  code?: string;
  type?: string;
  value?: number;
  used?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = { name: '', branch_id: '', code: '', type: 'percent', value: '10', is_active: true };

export default function VouchersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [v, b] = await Promise.all([
      api.get('/vouchers', { params: { search } }),
      api.get('/branches'),
    ]);
    setItems(v.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      name: row.name,
      branch_id: row.branch_id || '',
      code: row.code || '',
      type: row.type || 'percent',
      value: String(row.value ?? 0),
      is_active: row.is_active !== false,
    });
    setOpen(true);
  }

  async function onDelete(row: Row) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/promotions/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value || 0) };
      if (editing) await api.put(`/promotions/${editing.id}`, payload);
      else await api.post('/vouchers', payload);
      setOpen(false);
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Vouchers"
        icon={<Ticket className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Voucher
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
            onDelete: () => onDelete(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'code', header: 'Code', render: (r) => r.code || '—' },
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
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title={editing ? 'Edit Voucher' : 'Create Voucher'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="voucher-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="voucher-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Code">
            <input className={fieldClass} placeholder="Auto if empty" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
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
