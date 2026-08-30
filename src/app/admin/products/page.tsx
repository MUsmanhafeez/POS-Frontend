'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ImageIcon, Plus, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type ProductRow = {
  id: string;
  name: unknown;
  price?: number;
  sku?: string;
  isActive?: boolean;
  is_active?: boolean;
  thumbnail?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  menuId?: string;
  menu_id?: string;
};

type Menu = { id: string; name: unknown };

const emptyForm = { name: '', price: '', menu_id: '', sku: '', is_active: true, station: 'grill' };

export default function ProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [p, m] = await Promise.all([
      api.get('/products', { params: { search } }),
      api.get('/menus'),
    ]);
    setItems(p.data.body || []);
    setMenus(m.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, menu_id: menus[0]?.id || '' });
    setOpen(true);
  }

  function openEdit(row: ProductRow) {
    setEditing(row);
    setForm({
      name: labelOf(row.name),
      price: String(row.price ?? ''),
      menu_id: row.menu_id || row.menuId || '',
      sku: row.sku || '',
      is_active: row.isActive !== false && row.is_active !== false,
      station: (row as { station?: string }).station || 'grill',
    });
    setOpen(true);
  }

  async function onDelete(row: ProductRow) {
    if (!(await confirmRowDelete(labelOf(row.name)))) return;
    await api.delete(`/products/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
      };
      if (editing) await api.put(`/products/${editing.id}`, payload);
      else await api.post('/products', payload);
      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Products"
        icon={<ShoppingBag className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Product
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
            {
              key: 'thumbnail',
              header: 'Thumbnail',
              render: () => (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-muted">
                  <ImageIcon className="h-4 w-4" />
                </div>
              ),
            },
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            {
              key: 'price',
              header: 'Price',
              render: (r) => `JOD ${Number(r.price || 0).toFixed(3)}`,
            },
            {
              key: 'activation',
              header: 'Activation',
              render: (r) => <StatusBadge value={r.isActive === false || r.is_active === false ? 'Inactive' : 'Active'} />,
            },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => String(r.created_at || r.createdAt || '—').replace('T', ' ').slice(0, 19),
            },
            {
              key: 'updated',
              header: 'Updated at',
              render: (r) => String(r.updated_at || r.updatedAt || '—').replace('T', ' ').slice(0, 19),
            },
          ]}
        />
      </AdminListShell>

      <Modal
        open={open}
        title={editing ? 'Edit Product' : 'Create Product'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="product-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="product-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Menu">
            <select
              className={fieldClass}
              required
              value={form.menu_id}
              onChange={(e) => setForm({ ...form, menu_id: e.target.value })}
            >
              <option value="">Select menu</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {labelOf(m.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <input
              className={fieldClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Price">
            <input
              className={fieldClass}
              type="number"
              step="0.001"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Field>
          <Field label="SKU">
            <input className={fieldClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <Field label="Kitchen station">
            <select className={fieldClass} value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })}>
              <option value="grill">Grill</option>
              <option value="bar">Bar</option>
              <option value="cold">Cold</option>
              <option value="dessert">Dessert</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
        </form>
      </Modal>
    </>
  );
}
