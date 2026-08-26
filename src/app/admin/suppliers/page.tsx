'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type SupplierRow = {
  id: string;
  name: string;
  branch?: unknown;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
};

export default function SuppliersPage() {
  const [items, setItems] = useState<SupplierRow[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', branch_id: '', phone: '', email: '' });

  async function load() {
    const [s, b] = await Promise.all([
      api.get('/inventory/suppliers', { params: { search } }),
      api.get('/branches'),
    ]);
    setItems(s.data.body || []);
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
      await api.post('/inventory/suppliers', form);
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Suppliers"
        icon={<ShoppingCart className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', branch_id: branches[0]?.id || '', phone: '', email: '' });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Supplier
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
            { key: 'email', header: 'Email', render: (r) => r.email || '—' },
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
        title="Create Supplier"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="supplier-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="supplier-form" onSubmit={onSubmit} className="space-y-3">
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
          <Field label="Phone">
            <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={fieldClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
