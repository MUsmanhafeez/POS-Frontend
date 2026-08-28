'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import api from '@/lib/api';
import { PRINTERS_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Row = {
  id: string;
  name: string;
  printer_type?: string;
  printerType?: string;
  address?: string;
  branch_id?: string;
  is_active?: boolean;
};

const emptyForm = { name: '', printer_type: 'receipt', address: '', branch_id: '' };

export default function PrintersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, b] = await Promise.all([api.get('/printers'), api.get('/branches')]);
    setItems(p.data.body || []);
    setBranches(b.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, branch_id: branches[0]?.id || '' });
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      name: row.name,
      printer_type: row.printer_type || row.printerType || 'receipt',
      address: row.address || '',
      branch_id: row.branch_id || '',
    });
    setOpen(true);
  }

  async function onDelete(row: Row) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/printers/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/printers/${editing.id}`, form);
      else await api.post('/printers', form);
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
        title="Manage Printers"
        icon={<Printer className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        tabs={PRINTERS_TABS}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            Add printer
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No printers"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
            onDelete: () => onDelete(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name },
            { key: 'type', header: 'Type', render: (r) => r.printer_type || r.printerType || '—' },
            { key: 'addr', header: 'Address', render: (r) => r.address || '—' },
          ]}
        />
      </AdminListShell>
      <Modal
        open={open}
        title={editing ? 'Edit printer' : 'Add printer'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="printer-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Save'}
          />
        }
      >
        <form id="printer-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Branch">
            <select className={fieldClass} required value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Select</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {labelOf(b.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={fieldClass} value={form.printer_type} onChange={(e) => setForm({ ...form, printer_type: e.target.value })}>
              <option value="receipt">Receipt</option>
              <option value="kot">KOT</option>
              <option value="bar">Bar</option>
            </select>
          </Field>
          <Field label="Address / IP">
            <input className={fieldClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
