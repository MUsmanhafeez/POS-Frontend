'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ImageIcon, Plus, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type ProductRow = {
  id: string;
  name: unknown;
  price?: number;
  isActive?: boolean;
  thumbnail?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  menuId?: string;
};

type Menu = { id: string; name: unknown };

export default function ProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', menu_id: '', sku: '', is_active: true });

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/products', {
        ...form,
        price: Number(form.price || 0),
      });
      setOpen(false);
      setForm({ name: '', price: '', menu_id: menus[0]?.id || '', sku: '', is_active: true });
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
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', price: '', menu_id: menus[0]?.id || '', sku: '', is_active: true });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Product
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
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
              render: (r) => <StatusBadge value={r.isActive === false ? 'Inactive' : 'Active'} />,
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
            { key: 'actions', header: 'Actions', render: () => <ActionsMenu /> },
          ]}
        />
      </AdminListShell>

      <Modal
        open={open}
        title="Create Product"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="product-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
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
