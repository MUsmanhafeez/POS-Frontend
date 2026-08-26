'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Row = { id: string; name: string; phone?: string; email?: string; loyalty_points?: number; loyaltyPoints?: number };

export default function CustomersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/customers', { params: { search } });
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', form);
      setOpen(false);
      setForm({ name: '', phone: '', email: '' });
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
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            Add customer
          </button>
        }
      >
        <AdminPagedTable
          rows={items}
          emptyTitle="No customers"
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
        title="Add customer"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="cust-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Save" />}
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
