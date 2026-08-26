'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Ruler } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type UnitRow = {
  id: string;
  name: string;
  symbol: string;
  type: string;
  created_at?: string;
  updated_at?: string;
};

export default function UnitsPage() {
  const [items, setItems] = useState<UnitRow[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', symbol: '', type: 'Count' });

  async function load() {
    const r = await api.get('/inventory/units', { params: { search } });
    setItems(r.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/units', form);
      setOpen(false);
      setForm({ name: '', symbol: '', type: 'Count' });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Units"
        icon={<Ruler className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create Unit
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'symbol', header: 'Symbol', render: (r) => r.symbol },
            {
              key: 'type',
              header: 'Type',
              render: (r) => <StatusBadge value={r.type} />,
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
        title="Create Unit"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="unit-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="unit-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Symbol">
            <input className={fieldClass} required value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={fieldClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Count">Count</option>
              <option value="Custom">Custom</option>
            </select>
          </Field>
        </form>
      </Modal>
    </>
  );
}
