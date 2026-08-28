'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { List, Plus } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type IngredientRow = {
  id: string;
  name: string;
  branch?: unknown;
  branch_id?: string;
  current_stock?: number;
  quantity?: number;
  alert_quantity?: number;
  reorder_level?: number;
  unit?: string;
  cost_per_unit?: number;
  cost?: number;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = {
  name: '',
  branch_id: '',
  unit: 'pcs',
  quantity: '0',
  reorder_level: '5',
  cost: '0',
};

export default function IngredientsPage() {
  const [items, setItems] = useState<IngredientRow[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; symbol: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [i, b, u] = await Promise.all([
      api.get('/inventory/ingredients', { params: { search } }),
      api.get('/branches'),
      api.get('/inventory/units'),
    ]);
    setItems(i.data.body || []);
    setBranches(b.data.body || []);
    setUnits(u.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || '',
      unit: units[0]?.symbol || 'pcs',
    });
    setOpen(true);
  }

  function openEdit(row: IngredientRow) {
    setEditing(row);
    setForm({
      name: row.name,
      branch_id: row.branch_id || '',
      unit: row.unit || 'pcs',
      quantity: String(row.current_stock ?? row.quantity ?? 0),
      reorder_level: String(row.alert_quantity ?? row.reorder_level ?? 0),
      cost: String(row.cost_per_unit ?? row.cost ?? 0),
    });
    setOpen(true);
  }

  async function onDelete(row: IngredientRow) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/inventory/ingredients/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity || 0),
        reorder_level: Number(form.reorder_level || 0),
        cost: Number(form.cost || 0),
      };
      if (editing) await api.put(`/inventory/ingredients/${editing.id}`, payload);
      else await api.post('/inventory/ingredients', payload);
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
        title="Ingredients"
        icon={<List className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Ingredient
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
            { key: 'stock', header: 'Current Stock', render: (r) => String(r.current_stock ?? 0) },
            { key: 'alert', header: 'Alert Quantity', render: (r) => String(r.alert_quantity ?? 0) },
            { key: 'unit', header: 'Unit', render: (r) => r.unit || '—' },
            {
              key: 'cost',
              header: 'Cost Per Unit',
              render: (r) => `JOD ${Number(r.cost_per_unit || 0).toFixed(3)}`,
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
        title={editing ? 'Edit Ingredient' : 'Create Ingredient'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="ingredient-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="ingredient-form" onSubmit={onSubmit} className="space-y-3">
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
          <Field label="Unit">
            <select className={fieldClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {units.map((u) => (
                <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>
              ))}
            </select>
          </Field>
          <Field label="Current Stock">
            <input className={fieldClass} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          <Field label="Alert Quantity">
            <input className={fieldClass} type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          </Field>
          <Field label="Cost Per Unit">
            <input className={fieldClass} type="number" step="0.001" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
