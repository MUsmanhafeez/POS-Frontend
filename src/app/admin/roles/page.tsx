'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { fieldClass } from '@/lib/ui';

type Role = {
  id: string;
  name: string;
  display_name?: string;
  displayName?: string;
  permissions: string[];
  is_system?: boolean;
};

export default function RolesPage() {
  const [items, setItems] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Role | null>(null);
  const [permsText, setPermsText] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/roles');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const rows = items.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.name.includes(q) || String(r.display_name || r.displayName || '').toLowerCase().includes(q);
  });

  function openEdit(row: Role) {
    setEdit(row);
    setPermsText((row.permissions || []).join('\n'));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    try {
      const permissions = permsText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      await api.put(`/roles/${edit.id}`, {
        display_name: edit.display_name || edit.displayName,
        permissions,
      });
      setEdit(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell title="Roles" icon={<Shield className="h-5 w-5 text-plum" />} search={search} onSearch={setSearch}>
        <AdminPagedTable
          rows={rows}
          emptyTitle="No roles"
          rowActions={(row) => ({
            onEdit: () => openEdit(row),
          })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name },
            { key: 'display', header: 'Display', render: (r) => r.display_name || r.displayName || '—' },
            { key: 'perms', header: 'Permissions', render: (r) => String((r.permissions || []).length) },
          ]}
        />
      </AdminListShell>

      <Modal
        open={Boolean(edit)}
        title="Edit role"
        onClose={() => setEdit(null)}
        footer={<FormActions formId="role-edit" onCancel={() => setEdit(null)} saving={saving} submitLabel="Save" />}
      >
        {edit ? (
          <form id="role-edit" onSubmit={onSave} className="space-y-3">
            <Field label="Display name">
              <input
                className={fieldClass}
                value={edit.display_name || edit.displayName || ''}
                onChange={(e) => setEdit({ ...edit, display_name: e.target.value })}
              />
            </Field>
            <Field label="Permissions (one per line)">
              <textarea className={`${fieldClass} min-h-[220px] font-mono text-xs`} value={permsText} onChange={(e) => setPermsText(e.target.value)} />
            </Field>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
