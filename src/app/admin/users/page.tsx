'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Badge, DataTable, Field, FormActions, Modal, PageHeader } from '@/components/ui';
import { btnGhost, btnPrimary, fieldClass } from '@/lib/ui';

type UserRow = {
  id: string;
  name: string;
  email?: string;
  username?: string;
  is_active?: boolean;
  role?: { id?: string; name?: string; display_name?: string } | null;
};

type Role = { id: string; name: string; displayName?: string; display_name?: string };

const empty = { name: '', email: '', username: '', password: '', role_id: '', is_active: true };

export default function UsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [u, r] = await Promise.all([api.get('/users'), api.get('/roles')]);
    setItems(u.data.body || []);
    setRoles(r.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...empty, role_id: roles[0]?.id || '' });
    setError('');
    setOpen(true);
  }

  function openEdit(row: UserRow) {
    setEditing(row);
    setForm({
      name: row.name || '',
      email: row.email || '',
      username: row.username || '',
      password: '',
      role_id: row.role?.id || '',
      is_active: row.is_active !== false,
    });
    setError('');
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email || undefined,
        username: form.username || undefined,
        role_id: form.role_id,
        is_active: form.is_active,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) await api.put(`/users/${editing.id}`, payload);
      else {
        if (!form.password) throw new Error('Password is required');
        await api.post('/users', { ...payload, password: form.password });
      }
      setOpen(false);
      await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: UserRow) {
    if (!confirm(`Delete user “${row.name}”?`)) return;
    await api.delete(`/users/${row.id}`);
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage staff accounts, roles, and access."
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add user
          </button>
        }
      />

      <DataTable
        rows={items}
        emptyTitle="No users yet"
        emptyDescription="Create your first staff account to get started."
        columns={[
          { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
          { key: 'email', header: 'Email', render: (r) => r.email || '—' },
          { key: 'role', header: 'Role', render: (r) => r.role?.display_name || r.role?.name || '—' },
          {
            key: 'status',
            header: 'Status',
            render: (r) => <Badge tone={r.is_active === false ? 'neutral' : 'success'}>{r.is_active === false ? 'Inactive' : 'Active'}</Badge>,
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'w-28',
            render: (r) => (
              <div className="flex justify-end gap-1">
                <button type="button" className={btnGhost} onClick={() => openEdit(r)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className={btnGhost} onClick={() => onDelete(r)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-danger" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editing ? 'Edit user' : 'Add user'}
        onClose={() => setOpen(false)}
        footer={<FormActions formId="user-form" onCancel={() => setOpen(false)} saving={saving} />}
      >
        <form id="user-form" onSubmit={onSubmit} className="space-y-3">
          {error && <div className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={fieldClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Username">
            <input className={fieldClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label={editing ? 'Password (leave blank to keep)' : 'Password'}>
            <input className={fieldClass} type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <select className={fieldClass} required value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.displayName || role.display_name || role.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </form>
      </Modal>
    </div>
  );
}
