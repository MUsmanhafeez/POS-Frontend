'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  branch?: unknown;
  ingredient?: string;
  type?: string;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = { ingredient_id: '', branch_id: '', type: 'in', quantity: '1' };

export default function StockMovementsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [ingredients, setIngredients] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [m, i, b] = await Promise.all([
      api.get('/inventory/stock-movements'),
      api.get('/inventory/ingredients'),
      api.get('/branches'),
    ]);
    setItems(m.data.body || []);
    setIngredients(i.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        String(r.ingredient || '').toLowerCase().includes(q) ||
        labelOf(r.branch).toLowerCase().includes(q) ||
        String(r.type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  function openCreate() {
    setForm({
      ingredient_id: ingredients[0]?.id || '',
      branch_id: branches[0]?.id || '',
      type: 'in',
      quantity: '1',
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/stock-movements', { ...form, quantity: Number(form.quantity || 0) });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Stock Movements"
        icon={<TrendingUp className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Stock Movement
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'ingredient', header: 'Ingredient', render: (r) => r.ingredient || '—' },
            { key: 'type', header: 'Type', render: (r) => <StatusBadge value={r.type} /> },
            { key: 'qty', header: 'Quantity', render: (r) => String(r.quantity ?? 0) },
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
        title="Create Stock Movement"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="sm-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="sm-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Ingredient">
            <select className={fieldClass} required value={form.ingredient_id} onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}>
              <option value="">Select</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
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
              <option value="in">in</option>
              <option value="out">out</option>
              <option value="waste">waste</option>
              <option value="adjust">adjust</option>
            </select>
          </Field>
          <Field label="Quantity">
            <input className={fieldClass} type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
