'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  branch?: unknown;
  voucher_no?: string;
  closing_date?: string;
  template?: string;
  status?: string;
  items?: number;
  posted_by?: string;
  created_at?: string;
};

export default function StockClosingsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: '',
    voucher_no: '',
    closing_date: new Date().toISOString().slice(0, 10),
    template: 'Default',
    status: 'draft',
    items_count: '0',
  });

  async function load() {
    const [c, b] = await Promise.all([api.get('/inventory/stock-closings'), api.get('/branches')]);
    setItems(c.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        String(r.voucher_no || '').toLowerCase().includes(q) ||
        labelOf(r.branch).toLowerCase().includes(q)
    );
  }, [items, search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/stock-closings', { ...form, items_count: Number(form.items_count || 0) });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Stock Closings"
        icon={<ClipboardCheck className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({
                branch_id: branches[0]?.id || '',
                voucher_no: '',
                closing_date: new Date().toISOString().slice(0, 10),
                template: 'Default',
                status: 'draft',
                items_count: '0',
              });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Stock Closing
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'voucher', header: 'Voucher No', render: (r) => r.voucher_no || '—' },
            {
              key: 'date',
              header: 'Closing Date',
              render: (r) => String(r.closing_date || '—').slice(0, 10),
            },
            { key: 'template', header: 'Template', render: (r) => r.template || '—' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            { key: 'items', header: 'Items', render: (r) => String(r.items ?? 0) },
            { key: 'posted', header: 'Posted By', render: (r) => r.posted_by || '—' },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => String(r.created_at || '—').replace('T', ' ').slice(0, 19),
            },
            { key: 'actions', header: 'Actions', render: () => <ActionsMenu /> },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title="Create Stock Closing"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="sc-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="sc-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Branch">
            <select className={fieldClass} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Optional</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Voucher No">
            <input className={fieldClass} placeholder="Auto if empty" value={form.voucher_no} onChange={(e) => setForm({ ...form, voucher_no: e.target.value })} />
          </Field>
          <Field label="Closing Date">
            <input className={fieldClass} type="date" required value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} />
          </Field>
          <Field label="Template">
            <input className={fieldClass} value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} />
          </Field>
          <Field label="Items">
            <input className={fieldClass} type="number" value={form.items_count} onChange={(e) => setForm({ ...form, items_count: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
