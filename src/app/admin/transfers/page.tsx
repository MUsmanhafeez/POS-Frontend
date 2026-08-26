'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = { id: string; fromBranchId?: string; toBranchId?: string; from_branch_id?: string; to_branch_id?: string; status: string; items?: unknown };

export default function TransfersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from_branch_id: '', to_branch_id: '', notes: '', item_name: '', qty: '1' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [t, b] = await Promise.all([api.get('/transfers'), api.get('/branches')]);
    setItems(t.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/transfers', {
        from_branch_id: form.from_branch_id,
        to_branch_id: form.to_branch_id,
        notes: form.notes,
        items: [{ name: form.item_name, qty: Number(form.qty) }],
      });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await api.put(`/transfers/${id}/status`, { status });
    await load();
  }

  const branchName = (id?: string) => labelOf(branches.find((b) => b.id === id)?.name) || id || '—';

  return (
    <>
      <AdminListShell
        title="Inter-Branch Transfers"
        icon={<ArrowLeftRight className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            New transfer
          </button>
        }
      >
        <AdminPagedTable
          rows={items}
          emptyTitle="No transfers"
          columns={[
            { key: 'from', header: 'From', render: (r) => branchName(r.from_branch_id || r.fromBranchId) },
            { key: 'to', header: 'To', render: (r) => branchName(r.to_branch_id || r.toBranchId) },
            { key: 'status', header: 'Status', render: (r) => r.status },
            {
              key: 'a',
              header: '',
              render: (r) =>
                r.status === 'requested' ? (
                  <button type="button" className="text-sm text-brand" onClick={() => setStatus(r.id, 'approved')}>
                    Approve
                  </button>
                ) : r.status === 'approved' ? (
                  <button type="button" className="text-sm text-brand" onClick={() => setStatus(r.id, 'received')}>
                    Receive
                  </button>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title="New IBT"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="ibt-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Request" />}
      >
        <form id="ibt-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="From branch">
            <select className={fieldClass} required value={form.from_branch_id} onChange={(e) => setForm({ ...form, from_branch_id: e.target.value })}>
              <option value="">Select</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {labelOf(b.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="To branch">
            <select className={fieldClass} required value={form.to_branch_id} onChange={(e) => setForm({ ...form, to_branch_id: e.target.value })}>
              <option value="">Select</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {labelOf(b.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Item">
            <input className={fieldClass} required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
          </Field>
          <Field label="Qty">
            <input className={fieldClass} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
