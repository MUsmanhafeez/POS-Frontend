'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Row = { id: string; name: string; rate: number; is_active?: boolean };

export default function TaxesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', rate: '0' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/taxes');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/taxes', { name: form.name, rate: Number(form.rate) });
      setOpen(false);
      setForm({ name: '', rate: '0' });
      await load();
    } finally {
      setSaving(false);
    }
  }

  const rows = items.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <AdminListShell
        title="Taxes"
        icon={<Percent className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            Add tax
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No tax rules"
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name },
            { key: 'rate', header: 'Rate %', render: (r) => Number(r.rate).toFixed(2) },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title="Add tax"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="tax-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Save" />}
      >
        <form id="tax-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Rate %">
            <input className={fieldClass} type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
