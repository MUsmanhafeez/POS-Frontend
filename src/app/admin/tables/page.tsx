'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, QrCode, Square } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type TableRow = {
  id: string;
  name: string;
  branch?: unknown;
  floor?: unknown;
  zone?: unknown;
  capacity?: number;
  status?: string;
  qrcode?: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Branch = { id: string; name: unknown };
type Floor = { id: string; name: unknown; branchId?: string };
type Zone = { id: string; name: unknown; floorId?: string };

export default function TablesPage() {
  const [items, setItems] = useState<TableRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    capacity: '4',
    branch_id: '',
    floor_id: '',
    zone_id: '',
    status: 'available',
    is_active: true,
  });

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tables', {
        ...form,
        capacity: Number(form.capacity || 4),
        zone_id: form.zone_id || null,
      });
      setOpen(false);
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
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({
                name: '',
                capacity: '4',
                branch_id: branches[0]?.id || '',
                floor_id: floors[0]?.id || '',
                zone_id: '',
                status: 'available',
                is_active: true,
              });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Table
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
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
        title="Create Table"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="table-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
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
