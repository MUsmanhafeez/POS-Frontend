'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type ShiftRow = {
  id: string;
  name: string;
  branch?: unknown;
  branch_id?: string;
  code?: string | null;
  start_time?: string;
  end_time?: string;
  block_close_if_pending?: boolean;
  is_active?: boolean;
  created_at?: string;
};

type Branch = { id: string; name: unknown };

const emptyForm = {
  name: '',
  code: '',
  branch_id: '',
  start_time: '10:00',
  end_time: '19:00',
  block_close_if_pending: true,
  is_active: true,
};

function timeInputValue(value?: string) {
  return String(value || '10:00').slice(0, 5);
}

export default function ShiftsPage() {
  const [items, setItems] = useState<ShiftRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [s, b] = await Promise.all([
      api.get('/shifts', { params: { search } }),
      api.get('/branches'),
    ]);
    setItems(s.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, branch_id: branches[0]?.id || '' });
    setOpen(true);
  }

  function openEdit(row: ShiftRow) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code || '',
      branch_id: row.branch_id || '',
      start_time: timeInputValue(row.start_time),
      end_time: timeInputValue(row.end_time),
      block_close_if_pending: row.block_close_if_pending !== false,
      is_active: row.is_active !== false,
    });
    setOpen(true);
  }

  async function onDelete(row: ShiftRow) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/shifts/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
        end_time: form.end_time.length === 5 ? `${form.end_time}:00` : form.end_time,
      };
      if (editing) await api.put(`/shifts/${editing.id}`, payload);
      else await api.post('/shifts', payload);
      setOpen(false);
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Shifts"
        icon={<Clock className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Shift
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
            onDelete: () => onDelete(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'code', header: 'Code', render: (r) => r.code || '—' },
            { key: 'starts', header: 'Starts At', render: (r) => r.start_time || '—' },
            { key: 'ends', header: 'Ends At', render: (r) => r.end_time || '—' },
            {
              key: 'block',
              header: 'Block Close If Pending',
              render: (r) => String(Boolean(r.block_close_if_pending)),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusBadge value={r.is_active === false ? 'Inactive' : 'Active'} />,
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
        title={editing ? 'Edit Shift' : 'Create Shift'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="shift-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="shift-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Branch">
            <select className={fieldClass} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Optional</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Code">
            <input className={fieldClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </Field>
          <Field label="Starts At">
            <input className={fieldClass} type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </Field>
          <Field label="Ends At">
            <input className={fieldClass} type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.block_close_if_pending}
              onChange={(e) => setForm({ ...form, block_close_if_pending: e.target.checked })}
            />
            Block close if pending
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
