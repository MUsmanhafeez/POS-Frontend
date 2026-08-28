'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Grid2x2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type MenuRow = {
  id: string;
  name: unknown;
  description?: unknown;
  branch?: unknown;
  branch_id?: string;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Branch = { id: string; name: unknown };

const emptyForm = { name: '', description: '', branch_id: '', is_active: true };

export default function MenusPage() {
  const [items, setItems] = useState<MenuRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, branch_id: branches[0]?.id || '' });
    setOpen(true);
  }

  function openEdit(row: MenuRow) {
    setEditing(row);
    setForm({
      name: labelOf(row.name),
      description: labelOf(row.description),
      branch_id: row.branch_id || '',
      is_active: row.isActive !== false && row.is_active !== false,
    });
    setOpen(true);
  }

  async function onDelete(row: MenuRow) {
    if (!(await confirmRowDelete(labelOf(row.name)))) return;
    await api.delete(`/menus/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/menus/${editing.id}`, form);
      else await api.post('/menus', form);
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
        title="Menus"
        icon={<Grid2x2 className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Menu
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
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
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
        title={editing ? 'Edit Menu' : 'Create Menu'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="menu-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
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
