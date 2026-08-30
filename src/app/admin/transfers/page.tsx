'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { TOOLS_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type TransferItem = { name?: string; qty?: number; sku?: string };
type Row = {
  id: string;
  fromBranchId?: string;
  toBranchId?: string;
  from_branch_id?: string;
  to_branch_id?: string;
  status: string;
  items?: TransferItem[];
  notes?: string;
};

export default function TransfersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    const label = status === 'approved' ? 'Approve this transfer?' : 'Mark as received and adjust stock?';
    if (!window.confirm(label)) return;
    await api.put(`/transfers/${id}/status`, { status });
    await load();
  }

  const branchName = (id?: string) => labelOf(branches.find((b) => b.id === id)?.name) || id || '—';

  const filtered = items.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      branchName(r.from_branch_id || r.fromBranchId).toLowerCase().includes(q) ||
      branchName(r.to_branch_id || r.toBranchId).toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <AdminListShell
        title="Inter-Branch Transfers"
        icon={<ArrowLeftRight className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        tabs={TOOLS_TABS}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            New transfer
          </button>
        }
      >
        <AdminPagedTable
          rows={filtered}
          emptyTitle="No transfers"
          columns={[
            {
              key: 'expand',
              header: '',
              render: (r) => (
                <button
                  type="button"
                  className="rounded p-1 text-muted hover:bg-surface-muted"
                  onClick={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                  aria-label="Toggle details"
                >
                  {expandedId === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              ),
            },
            { key: 'from', header: 'From', render: (r) => branchName(r.from_branch_id || r.fromBranchId) },
            { key: 'to', header: 'To', render: (r) => branchName(r.to_branch_id || r.toBranchId) },
            { key: 'status', header: 'Status', render: (r) => r.status },
            {
              key: 'items',
              header: 'Lines',
              render: (r) => (Array.isArray(r.items) ? r.items.length : 0),
            },
            {
              key: 'a',
              header: 'Actions',
              render: (r) =>
                r.status === 'requested' ? (
                  <button type="button" className="text-sm text-brand hover:underline" onClick={() => setStatus(r.id, 'approved')}>
                    Approve
                  </button>
                ) : r.status === 'approved' ? (
                  <button type="button" className="text-sm text-brand hover:underline" onClick={() => setStatus(r.id, 'received')}>
                    Receive
                  </button>
                ) : (
                  '—'
                ),
            },
          ]}
        />
        {expandedId && (() => {
          const row = items.find((r) => r.id === expandedId);
          if (!row) return null;
          return (
            <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="mb-2 font-semibold">Transfer details</div>
              {row.notes && <p className="mb-2 text-muted">Notes: {row.notes}</p>}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-muted">
                    <th className="py-1">Item</th>
                    <th className="py-1">SKU</th>
                    <th className="py-1">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(row.items || []).map((line, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="py-1">{line.name || '—'}</td>
                      <td className="py-1">{line.sku || '—'}</td>
                      <td className="py-1">{line.qty ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!row.items?.length && <p className="text-muted">No line items</p>}
            </div>
          );
        })()}
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
