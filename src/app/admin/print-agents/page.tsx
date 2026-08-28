'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Cpu, Plus } from 'lucide-react';
import api from '@/lib/api';
import { PRINTERS_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Badge, Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  name: string;
  host?: string;
  port?: number;
  branch_id?: string;
  is_active?: boolean;
  isActive?: boolean;
  branch?: unknown;
  api_key?: string;
};

const emptyForm = {
  name: '',
  branch_id: '',
  is_active: true,
  api_key: '',
  host: '',
  port: '',
};

export default function PrintAgentsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [a, b] = await Promise.all([api.get('/print-agents'), api.get('/branches')]);
    setItems(a.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      name: row.name,
      branch_id: row.branch_id || '',
      is_active: row.is_active !== false && row.isActive !== false,
      api_key: row.api_key || '',
      host: row.host || '',
      port: row.port != null ? String(row.port) : '',
    });
    setOpen(true);
  }

  async function onDelete(row: Row) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/print-agents/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/print-agents/${editing.id}`, {
        ...form,
        port: form.port ? Number(form.port) : null,
      });
      setOpen(false);
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const rows = items.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <AdminListShell
        title="Print Agents"
        icon={<Cpu className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        tabs={PRINTERS_TABS}
        action={
          <Link href="/admin/print-agents/create" className={btnPrimary}>
            <Plus className="h-4 w-4" /> Create Print Agent
          </Link>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No print agents"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
            onDelete: () => onDelete(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name },
            { key: 'host', header: 'Host', render: (r) => r.host || '—' },
            { key: 'port', header: 'Port', render: (r) => r.port ?? '—' },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge tone={r.is_active !== false && r.isActive !== false ? 'success' : 'neutral'}>
                  {r.is_active !== false && r.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
          ]}
        />
      </AdminListShell>

      <Modal
        open={open}
        title="Edit Print Agent"
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="agent-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel="Update"
          />
        }
      >
        <form id="agent-form" onSubmit={onSubmit} className="space-y-3">
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
          <Field label="Host">
            <input className={fieldClass} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
          </Field>
          <Field label="Port">
            <input className={fieldClass} type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
          </Field>
          <Field label="API Key">
            <input className={fieldClass} value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </form>
      </Modal>
    </>
  );
}
