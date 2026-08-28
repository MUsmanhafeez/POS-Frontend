'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  reference_no?: string;
  branch?: unknown;
  supplier?: string;
  total?: number;
  status?: string;
  expected_at?: string;
  created_at?: string;
};

const emptyForm = {
  reference_no: '',
  branch_id: '',
  supplier_id: '',
  total: '0',
  status: 'pending',
  expected_at: '',
};

export default function PurchasesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [p, b, s] = await Promise.all([
      api.get('/inventory/purchases', { params: { search } }),
      api.get('/branches'),
      api.get('/inventory/suppliers'),
    ]);
    setItems(p.data.body || []);
    setBranches(b.data.body || []);
    setSuppliers(s.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  function openCreate() {
    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/purchases', {
        ...form,
        total: Number(form.total || 0),
        expected_at: form.expected_at || null,
        supplier_id: form.supplier_id || null,
      });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Purchases"
        icon={<FileText className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Purchase
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'ref', header: 'Reference No', render: (r) => <span className="font-medium">{r.reference_no || '—'}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'supplier', header: 'Supplier', render: (r) => r.supplier || '—' },
            { key: 'total', header: 'Total', render: (r) => `JOD ${Number(r.total || 0).toFixed(3)}` },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            {
              key: 'expected',
              header: 'Expected At',
              render: (r) => (r.expected_at ? String(r.expected_at).replace('T', ' ').slice(0, 19) : '—'),
            },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => String(r.created_at || '—').replace('T', ' ').slice(0, 19),
            },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title="Create Purchase"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="po-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="po-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Reference No">
            <input className={fieldClass} placeholder="Auto if empty" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
          </Field>
          <Field label="Branch">
            <select className={fieldClass} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Optional</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Supplier">
            <select className={fieldClass} value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">Optional</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Total">
            <input className={fieldClass} type="number" step="0.001" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
          </Field>
          <Field label="Expected At">
            <input className={fieldClass} type="datetime-local" value={form.expected_at} onChange={(e) => setForm({ ...form, expected_at: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
