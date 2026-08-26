'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ListTree, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type OptionRow = {
  id: string;
  name: unknown;
  branch?: unknown;
  type?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  menuId?: string;
};

type Menu = { id: string; name: unknown };

export default function OptionsPage() {
  const [items, setItems] = useState<OptionRow[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', menu_id: '', is_required: false, value_name: '', value_price: '0' });

  async function load() {
    const [o, m] = await Promise.all([
      api.get('/options', { params: { search } }),
      api.get('/menus'),
    ]);
    setItems(o.data.body || []);
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
      await api.post('/options', {
        name: form.name,
        menu_id: form.menu_id || null,
        is_required: form.is_required,
        values: [{ name: form.value_name || form.name, price: Number(form.value_price || 0) }],
      });
      setOpen(false);
      setForm({ name: '', menu_id: menus[0]?.id || '', is_required: false, value_name: '', value_price: '0' });
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
        title="Options"
        icon={<ListTree className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', menu_id: menus[0]?.id || '', is_required: false, value_name: '', value_price: '0' });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Option
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'type', header: 'Type', render: (r) => r.type || 'Optional' },
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
        title="Create Option"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="option-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="option-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input
              className={fieldClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Menu">
            <select
              className={fieldClass}
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
          <Field label="Default value">
            <input
              className={fieldClass}
              placeholder="Same as name if empty"
              value={form.value_name}
              onChange={(e) => setForm({ ...form, value_name: e.target.value })}
            />
          </Field>
          <Field label="Value price">
            <input
              className={fieldClass}
              type="number"
              step="0.001"
              value={form.value_price}
              onChange={(e) => setForm({ ...form, value_price: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
            />
            Required
          </label>
        </form>
      </Modal>
    </>
  );
}
