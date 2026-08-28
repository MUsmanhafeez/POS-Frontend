'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, QrCode, Square } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { confirmRowDelete } from '@/components/admin/RowActionsMenu';
import { Field, FormActions, Modal } from '@/components/ui';
import { rowLabel } from '@/lib/tableCrud';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type TableRow = {
  id: string;
  name: string;
  branch?: unknown;
  branch_id?: string;
  floor?: unknown;
  floor_id?: string;
  zone?: unknown;
  zone_id?: string;
  capacity?: number;
  status?: string;
  qrcode?: string;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Branch = { id: string; name: unknown };
type Floor = { id: string; name: unknown; branchId?: string };
type Zone = { id: string; name: unknown; floorId?: string };

const emptyForm = {
  name: '',
  capacity: '4',
  branch_id: '',
  floor_id: '',
  zone_id: '',
  status: 'available',
  is_active: true,
};

export default function TablesPage() {
  const [items, setItems] = useState<TableRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TableRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [t, b, f, z] = await Promise.all([
      api.get('/tables', { params: { search } }),
      api.get('/branches'),
      api.get('/floors'),
      api.get('/zones'),
    ]);
    setItems(t.data.body || []);
    setBranches(b.data.body || []);
    setFloors(f.data.body || []);
    setZones(z.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);
  const floorZones = zones.filter((z) => !form.floor_id || z.floorId === form.floor_id);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || '',
      floor_id: floors[0]?.id || '',
    });
    setOpen(true);
  }

  function openEdit(row: TableRow) {
    setEditing(row);
    setForm({
      name: row.name,
      capacity: String(row.capacity ?? 4),
      branch_id: row.branch_id || '',
      floor_id: row.floor_id || '',
      zone_id: row.zone_id || '',
      status: row.status || 'available',
      is_active: row.isActive !== false && row.is_active !== false,
    });
    setOpen(true);
  }

  async function onDelete(row: TableRow) {
    if (!(await confirmRowDelete(rowLabel(row)))) return;
    await api.delete(`/tables/${row.id}`);
    await load();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity || 4),
        zone_id: form.zone_id || null,
      };
      if (editing) await api.put(`/tables/${editing.id}`, payload);
      else await api.post('/tables', payload);
      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Tables"
        icon={<Square className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Table
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
            { key: 'floor', header: 'Floor', render: (r) => labelOf(r.floor) || '—' },
            { key: 'zone', header: 'Zone', render: (r) => labelOf(r.zone) || '—' },
            { key: 'capacity', header: 'Capacity', render: (r) => String(r.capacity ?? '—') },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status || 'available'} /> },
            {
              key: 'qrcode',
              header: 'QR Code',
              render: (r) =>
                r.qrcode ? (
                  <a href={r.qrcode} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-plum hover:underline">
                    <QrCode className="h-4 w-4" /> View
                  </a>
                ) : (
                  '—'
                ),
            },
            {
              key: 'activation',
              header: 'Activation',
              render: (r) => <StatusBadge value={r.isActive === false || r.is_active === false ? 'Inactive' : 'Active'} />,
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
          ]}
        />
      </AdminListShell>

      <Modal
        open={open}
        title={editing ? 'Edit Table' : 'Create Table'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <FormActions
            formId="table-form"
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            saving={saving}
            submitLabel={editing ? 'Update' : 'Create'}
          />
        }
      >
        <form id="table-form" onSubmit={onSubmit} className="space-y-3">
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
          <Field label="Floor">
            <select
              className={fieldClass}
              required
              value={form.floor_id}
              onChange={(e) => setForm({ ...form, floor_id: e.target.value, zone_id: '' })}
            >
              <option value="">Select floor</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>{labelOf(f.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Zone">
            <select className={fieldClass} value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })}>
              <option value="">Optional</option>
              {floorZones.map((z) => (
                <option key={z.id} value={z.id}>{labelOf(z.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Capacity">
            <input
              className={fieldClass}
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select className={fieldClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="available">available</option>
              <option value="occupied">occupied</option>
              <option value="reserved">reserved</option>
            </select>
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
