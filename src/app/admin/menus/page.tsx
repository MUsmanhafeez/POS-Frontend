'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Grid2x2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type MenuRow = {
  id: string;
  name: unknown;
  branch?: unknown;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Branch = { id: string; name: unknown };

export default function MenusPage() {
  const [items, setItems] = useState<MenuRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', branch_id: '', is_active: true });

  async function load() {
    const [m, b] = await Promise.all([
      api.get('/menus', { params: { search } }),
      api.get('/branches'),
    ]);
    setItems(m.data.body || []);
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
      await api.post('/menus', form);
      setOpen(false);
      setForm({ name: '', description: '', branch_id: branches[0]?.id || '', is_active: true });
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
        title="Menus"
        icon={<Grid2x2 className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', description: '', branch_id: branches[0]?.id || '', is_active: true });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Menu
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
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
        title="Create Menu"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="menu-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="menu-form" onSubmit={onSubmit} className="space-y-3">
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
          <Field label="Name">
            <input
              className={fieldClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={fieldClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
