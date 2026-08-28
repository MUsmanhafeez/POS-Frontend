'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import api from '@/lib/api';
import { LOCALIZATION_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Badge, Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';
import { formatLogDate } from '@/components/admin/LogCells';

type Row = {
  id: string;
  name: string;
  code?: string;
  rate: number;
  compound?: boolean;
  tax_type?: string;
  taxType?: string;
  is_active?: boolean;
  isActive?: boolean;
  branch?: unknown;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

const emptyForm = {
  name: '',
  code: '',
  rate: '15',
  compound: false,
  tax_type: 'exclusive',
};

export default function TaxesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/taxes');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code || '',
      rate: String(row.rate ?? 15),
      compound: Boolean(row.compound),
      tax_type: row.tax_type || row.taxType || 'exclusive',
    });
    setOpen(true);
  }

  async function onDelete(row: Row) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/taxes/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        rate: Number(form.rate),
        compound: form.compound,
        tax_type: form.tax_type,
      };
      if (editing) await api.put(`/taxes/${editing.id}`, payload);
      else await api.post('/taxes', payload);
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const rows = items.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || String(r.code || '').includes(search));

  return (
    <>
      <AdminListShell
        title="Taxes"
        icon={<Percent className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        tabs={LOCALIZATION_TABS}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            + Create Tax
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No tax rules"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
            onDelete: () => onDelete(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name },
            {
              key: 'branch',
              header: 'Branch',
              render: (r) => (r.branch ? labelOf(r.branch) : '—'),
            },
            { key: 'code', header: 'Code', render: (r) => r.code || '—' },
            { key: 'rate', header: 'Rate', render: (r) => Number(r.rate).toFixed(0) },
            {
              key: 'compound',
              header: 'Compound',
              render: (r) => (
                <Badge tone={r.compound ? 'plum' : 'info'}>{r.compound ? 'Compound' : 'Uncompounded'}</Badge>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              render: (r) => (
                <Badge tone="neutral">{String(r.tax_type || r.taxType || 'exclusive').replace(/^./, (c) => c.toUpperCase())}</Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge tone={r.is_active !== false && r.isActive !== false ? 'success' : 'neutral'}>
                  {r.is_active !== false && r.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => formatLogDate(String(r.createdAt || r.created_at || '')),
            },
            {
              key: 'updated',
              header: 'Updated at',
              render: (r) => formatLogDate(String(r.updatedAt || r.updated_at || '')),
            },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title={editing ? 'Edit Tax' : 'Create Tax'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="tax-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="tax-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name"><input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VAT 15%" /></Field>
          <Field label="Code"><input className={fieldClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VAT_15" /></Field>
          <Field label="Rate %"><input className={fieldClass} type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.compound} onChange={(e) => setForm({ ...form, compound: e.target.checked })} /> Compound</label>
          <Field label="Type">
            <select className={fieldClass} value={form.tax_type} onChange={(e) => setForm({ ...form, tax_type: e.target.value })}>
              <option value="exclusive">Exclusive</option>
              <option value="inclusive">Inclusive</option>
            </select>
          </Field>
        </form>
      </Modal>
    </>
  );
}
