'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type BranchRow = {
  id: string;
  name: unknown;
  phone?: string;
  email?: string;
  city?: string;
  countryCode?: string;
  country_code?: string;
  timezone?: string;
  addressLine1?: string;
  address_line1?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
};

function InfoButton({ label }: { label: string }) {
  return (
    <button type="button" className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-muted">
      {label}
    </button>
  );
}

export default function BranchesPage() {
  const [items, setItems] = useState<BranchRow[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', phone: '', email: '', is_active: true });

  async function load() {
    const { data } = await api.get('/branches');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => labelOf(r.name).toLowerCase().includes(q) || String(r.city || '').toLowerCase().includes(q));
  }, [items, search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/branches', form);
      setOpen(false);
      setForm({ name: '', city: '', phone: '', email: '', is_active: true });
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
        title="Branches"
        icon={<Building2 className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm({ name: '', city: '', phone: '', email: '', is_active: true });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Branch
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            {
              key: 'id',
              header: 'ID',
              render: (r) => String(rows.findIndex((x) => x.id === r.id) + 1),
            },
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{labelOf(r.name)}</span> },
            {
              key: 'contact',
              header: 'Contact',
              render: () => <InfoButton label="Contact Info" />,
            },
            {
              key: 'regional',
              header: 'Regional Info',
              render: () => <InfoButton label="Regional Info" />,
            },
            {
              key: 'location',
              header: 'Location',
              render: () => <InfoButton label="View on Map" />,
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusBadge value={r.isActive === false ? 'Inactive' : 'Active'} />,
            },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => String(r.created_at || r.createdAt || '—').replace('T', ' ').slice(0, 19),
            },
            {
              key: 'updated',
              header: 'Updated at',
              render: (r) => String(r.updated_at || r.updatedAt || '—').replace('T', ' ').slice(0, 19),
            },
            { key: 'actions', header: 'Actions', render: (r) => (
              <div className="flex items-center gap-2">
                <Link href={`/admin/branches/${r.id}`} className="text-sm font-medium text-brand">
                  Configure
                </Link>
                <ActionsMenu />
              </div>
            ) },
          ]}
        />
      </AdminListShell>

      <Modal
        open={open}
        title="Create Branch"
        onClose={() => setOpen(false)}
        footer={<FormActions formId="branch-form" onCancel={() => setOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="branch-form" onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <input
              className={fieldClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="City">
            <input className={fieldClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input
              className={fieldClass}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
        </form>
      </Modal>
    </>
  );
}
