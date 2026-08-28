'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type SessionRow = {
  id: string;
  shift?: string;
  shift_name?: string;
  branch?: unknown;
  opened_by?: string;
  closed_by?: string | null;
  status?: string;
  opened_at?: string;
  closed_at?: string | null;
};

type Shift = { id: string; name: string; code?: string };
type Branch = { id: string; name: unknown };

const emptyForm = { shift_id: '', branch_id: '', notes: '' };

export default function ShiftSessionsPage() {
  const [items, setItems] = useState<SessionRow[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [ss, sh, b] = await Promise.all([
      api.get('/shift-sessions', { params: { search } }),
      api.get('/shifts'),
      api.get('/branches'),
    ]);
    setItems(ss.data.body || []);
    setShifts(sh.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  function openCreate() {
    setForm({
      shift_id: shifts[0]?.id || '',
      branch_id: branches[0]?.id || '',
      notes: '',
    });
    setOpen(true);
  }

  async function onClose(row: SessionRow) {
    if (!window.confirm(`Close shift session "${row.shift || row.shift_name || row.id}"?`)) return;
    await api.put(`/shift-sessions/${row.id}/close`);
    await load();
  }

  async function onDelete(row: SessionRow) {
    const label = String(row.shift || row.shift_name || row.id);
    if (!(await confirmRowDelete(label))) return;
    await api.delete(`/shift-sessions/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/shift-sessions', form);
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const isOpen = (row: SessionRow) => {
    const status = String(row.status || '').toLowerCase();
    return status !== 'closed' && !row.closed_at;
  };

  return (
    <>
      <AdminListShell
        title="Shift Sessions"
        icon={<Search className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Open Shift
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          rowActions={(row) => ({
            onDelete: () => onDelete(row),
            extra: isOpen(row)
              ? [{ label: 'Close', onClick: () => onClose(row) }]
              : undefined,
          })}
          columns={[
            { key: 'shift', header: 'Shift', render: (r) => r.shift || r.shift_name || '—' },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'opened_by', header: 'Opened By', render: (r) => r.opened_by || '—' },
            { key: 'closed_by', header: 'Closed By', render: (r) => r.closed_by || '—' },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusBadge value={r.status || 'Open'} />,
            },
            {
              key: 'opened',
              header: 'Opened At',
              render: (r) => String(r.opened_at || '—').replace('T', ' ').slice(0, 19),
            },
            {
              key: 'closed',
              header: 'Closed At',
              render: (r) => (r.closed_at ? String(r.closed_at).replace('T', ' ').slice(0, 19) : '—'),
            },
          ]}
        />
      </AdminListShell>

      <Modal
        open={open}
        title="Open Shift"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="ss-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Open" />}
      >
        <form id="ss-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Shift">
            <select className={fieldClass} required value={form.shift_id} onChange={(e) => setForm({ ...form, shift_id: e.target.value })}>
              <option value="">Select shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.code ? ` (${s.code})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Branch">
            <select className={fieldClass} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Optional</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className={fieldClass} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
