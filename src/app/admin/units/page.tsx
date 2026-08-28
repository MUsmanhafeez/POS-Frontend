'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Ruler } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass } from '@/lib/ui';

type UnitRow = {
  id: string;
  name: string;
  symbol: string;
  type: string;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = { name: '', symbol: '', type: 'Count' };

export default function UnitsPage() {
  const [items, setItems] = useState<UnitRow[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const r = await api.get('/inventory/units', { params: { search } });
    setItems(r.data.body || []);
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

  function openEdit(row: UnitRow) {
    setEditing(row);
    setForm({ name: row.name, symbol: row.symbol, type: row.type });
    setOpen(true);
  }

  async function onDelete(row: UnitRow) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/inventory/units/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/inventory/units/${editing.id}`, form);
      else await api.post('/inventory/units', form);
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Units"
        icon={<Ruler className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Unit
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
            { key: 'symbol', header: 'Symbol', render: (r) => r.symbol },
            {
              key: 'type',
              header: 'Type',
              render: (r) => <StatusBadge value={r.type} />,
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
        title={editing ? 'Edit Unit' : 'Create Unit'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="unit-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="unit-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Symbol">
            <input className={fieldClass} required value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={fieldClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Count">Count</option>
              <option value="Custom">Custom</option>
            </select>
          </Field>
        </form>
      </Modal>
    </>
  );
}
