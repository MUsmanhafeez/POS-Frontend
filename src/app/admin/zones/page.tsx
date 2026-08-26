'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type ZoneRow = {
  id: string;
  name: unknown;
  branch?: unknown;
  floor?: unknown;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Branch = { id: string; name: unknown };
type Floor = { id: string; name: unknown };

export default function ZonesPage() {
  const [items, setItems] = useState<ZoneRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', branch_id: '', floor_id: '', is_active: true });

  async function load() {
    const [z, b, f] = await Promise.all([
      api.get('/zones', { params: { search } }),
      api.get('/branches'),
      api.get('/floors'),
    ]);
    setItems(z.data.body || []);
    setBranches(b.data.body || []);
    setFloors(f.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/zones', form);
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
        title="Zones"
        icon={<LayoutGrid className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', branch_id: branches[0]?.id || '', floor_id: floors[0]?.id || '', is_active: true });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Zone
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'floor', header: 'Floor', render: (r) => labelOf(r.floor) || '—' },
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
        title="Create Zone"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="zone-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="zone-form" onSubmit={onSubmit} className="space-y-3">
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
            <select className={fieldClass} required value={form.floor_id} onChange={(e) => setForm({ ...form, floor_id: e.target.value })}>
              <option value="">Select floor</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>{labelOf(f.name)}</option>
              ))}
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
