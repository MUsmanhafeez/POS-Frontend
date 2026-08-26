'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Globe2, Plus, QrCode } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type OnlineMenuRow = {
  id: string;
  name: unknown;
  branch?: unknown;
  menu?: unknown;
  slug?: string;
  is_active?: boolean;
  qrcode?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Branch = { id: string; name: unknown };
type Menu = { id: string; name: unknown };

export default function OnlineMenusPage() {
  const [items, setItems] = useState<OnlineMenuRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', branch_id: '', menu_id: '', slug: '', is_active: true });

  async function load() {
    const [om, b, m] = await Promise.all([
      api.get('/online-menus', { params: { search } }),
      api.get('/branches'),
      api.get('/menus'),
    ]);
    setItems(om.data.body || []);
    setBranches(b.data.body || []);
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
      await api.post('/online-menus', form);
      setOpen(false);
      setForm({ name: '', branch_id: branches[0]?.id || '', menu_id: menus[0]?.id || '', slug: '', is_active: true });
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
        title="Online menus"
        icon={<Globe2 className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({
                name: '',
                branch_id: branches[0]?.id || '',
                menu_id: menus[0]?.id || '',
                slug: '',
                is_active: true,
              });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Online menu
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'menu', header: 'Menu', render: (r) => labelOf(r.menu) || '—' },
            { key: 'slug', header: 'Slug', render: (r) => r.slug || '—' },
            {
              key: 'activation',
              header: 'Activation',
              render: (r) => <StatusBadge value={r.is_active === false ? 'Inactive' : 'Active'} />,
            },
            {
              key: 'qrcode',
              header: 'Qrcode',
              render: (r) =>
                r.qrcode ? (
                  <a href={r.qrcode} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-plum hover:underline">
                    <QrCode className="h-4 w-4" /> View
                  </a>
                ) : (
                  '—'
                ),
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
        title="Create Online menu"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="online-menu-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="online-menu-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input
              className={fieldClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Branch">
            <select
              className={fieldClass}
              required
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {labelOf(b.name)}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Slug">
            <input
              className={fieldClass}
              placeholder="auto-generated if empty"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
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
