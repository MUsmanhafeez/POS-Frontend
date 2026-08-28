'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Row = { id: string; name: string; phone?: string; email?: string; loyalty_points?: number; loyaltyPoints?: number };

const emptyForm = { name: '', phone: '', email: '' };

export default function CustomersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/customers', { params: { search } });
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({ name: row.name, phone: row.phone || '', email: row.email || '' });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form);
      else await api.post('/customers', form);
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Customers"
        icon={<Users className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            Add customer
          </button>
        }
      >
        <AdminPagedTable
          rows={items}
          emptyTitle="No customers"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name },
            { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
            { key: 'email', header: 'Email', render: (r) => r.email || '—' },
            { key: 'pts', header: 'Points', render: (r) => r.loyalty_points ?? r.loyaltyPoints ?? 0 },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title={editing ? 'Edit customer' : 'Add customer'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="cust-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Save'}
          />
        }
      >
        <form id="cust-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
