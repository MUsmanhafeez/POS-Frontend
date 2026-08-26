'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { MonitorSmartphone, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type RegisterRow = {
  id: string;
  name: unknown;
  branch?: unknown;
  code?: string;
  invoice_printer?: string | null;
  bill_printer?: string | null;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Branch = { id: string; name: unknown };

export default function RegistersPage() {
  const [items, setItems] = useState<RegisterRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    branch_id: '',
    invoice_printer: '',
    bill_printer: '',
    is_active: true,
    is_floor_register: false,
  });

  async function load() {
    const [r, b] = await Promise.all([
      api.get('/pos/registers', { params: { search, include_inactive: '1' } }),
      api.get('/branches'),
    ]);
    setItems(r.data.body || []);
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
      await api.post('/pos/registers', form);
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Registers"
        icon={<MonitorSmartphone className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({
                name: '',
                code: '',
                branch_id: branches[0]?.id || '',
                invoice_printer: '',
                bill_printer: '',
                is_active: true,
                is_floor_register: false,
              });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Register
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'code', header: 'Code', render: (r) => r.code || '—' },
            { key: 'invoice', header: 'Invoice Printer', render: (r) => r.invoice_printer || '—' },
            { key: 'bill', header: 'Bill Printer', render: (r) => r.bill_printer || '—' },
            {
              key: 'activation',
              header: 'Activation',
              render: (r) => <StatusBadge value={r.isActive === false ? 'Inactive' : 'Active'} />,
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
        title="Create Register"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="register-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="register-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Branch">
            <select className={fieldClass} required value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Code">
            <input className={fieldClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Auto if empty" />
          </Field>
          <Field label="Invoice Printer">
            <input className={fieldClass} value={form.invoice_printer} onChange={(e) => setForm({ ...form, invoice_printer: e.target.value })} />
          </Field>
          <Field label="Bill Printer">
            <input className={fieldClass} value={form.bill_printer} onChange={(e) => setForm({ ...form, bill_printer: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_floor_register} onChange={(e) => setForm({ ...form, is_floor_register: e.target.checked })} />
            Floor register
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </form>
      </Modal>
    </>
  );
}
