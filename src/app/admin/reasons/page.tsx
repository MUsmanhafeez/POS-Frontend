'use client';

import { useEffect, useState } from 'react';
import { Ban, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type ReasonRow = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function ReasonsPage() {
  const [items, setItems] = useState<ReasonRow[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Refund', is_active: true });

  async function load() {
    const r = await api.get('/sales/reasons', { params: { search } });
    setItems(r.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sales/reasons', form);
      setOpen(false);
      setForm({ name: '', type: 'Refund', is_active: true });
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
        title="Reasons"
        icon={<Ban className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create Reason
          </button>
        }
      >
        <AdminPagedTable
          rows={items}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'type', header: 'Type', render: (r) => <StatusBadge value={r.type} /> },
            {
              key: 'active',
              header: 'Activation',
              render: (r) => <StatusBadge value={r.is_active ? 'Active' : 'Inactive'} />,
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
        title="Create Reason"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="reason-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="reason-form" className="space-y-3" onSubmit={onSubmit}>
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={fieldClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Refund</option>
              <option>Cancel</option>
              <option>Void</option>
              <option>Discount</option>
            </select>
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
