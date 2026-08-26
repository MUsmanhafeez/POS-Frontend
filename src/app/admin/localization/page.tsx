'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Globe2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';
import { useLocaleStore } from '@/stores/locale';

type Row = { id: string; key: string; value: Record<string, string> };

export default function LocalizationPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Row | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [en, setEn] = useState('');
  const [ar, setAr] = useState('');
  const [saving, setSaving] = useState(false);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const loadRemote = useLocaleStore((s) => s.loadRemote);

  async function load() {
    const { data } = await api.get('/translations');
    const list = (data.body || []) as Array<{ id?: string; key: string; value: Record<string, string> }>;
    setItems(list.map((r) => ({ ...r, id: r.id || r.key })));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const rows = items.filter((r) => !search || r.key.toLowerCase().includes(search.toLowerCase()));

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    try {
      await api.put(`/translations/${encodeURIComponent(edit.key)}`, { value: { en, ar } });
      setEdit(null);
      await load();
      await loadRemote().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/translations/${encodeURIComponent(keyName)}`, { value: { en, ar } });
      setCreateOpen(false);
      setKeyName('');
      setEn('');
      setAr('');
      await load();
      await loadRemote().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <div className="text-sm font-semibold">Active language</div>
          <p className="text-xs text-muted">Switch UI locale for the admin panel (EN / AR + RTL).</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`rounded-xl px-3 py-2 text-sm ${locale === 'en' ? 'bg-brand text-white' : 'border border-border'}`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLocale('ar')}
            className={`rounded-xl px-3 py-2 text-sm ${locale === 'ar' ? 'bg-brand text-white' : 'border border-border'}`}
          >
            العربية
          </button>
        </div>
      </div>

      <AdminListShell
        title="Localization"
        icon={<Globe2 className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setKeyName('ui::');
              setEn('');
              setAr('');
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add key
          </button>
        }
      >
        <AdminPagedTable
          rows={rows}
          emptyTitle="No translations"
          columns={[
            { key: 'key', header: 'Key', render: (r) => <span className="font-mono text-xs">{r.key}</span> },
            { key: 'en', header: 'EN', render: (r) => r.value?.en || '—' },
            { key: 'ar', header: 'AR', render: (r) => r.value?.ar || '—' },
            {
              key: 'a',
              header: '',
              render: (r) => (
                <button
                  type="button"
                  className="text-sm text-brand"
                  onClick={() => {
                    setEdit(r);
                    setEn(r.value?.en || '');
                    setAr(r.value?.ar || '');
                  }}
                >
                  Edit
                </button>
              ),
            },
          ]}
        />
      </AdminListShell>

      <Modal
        open={Boolean(edit)}
        title="Edit translation"
        onClose={() => setEdit(null)}
        footer={<FormActions formId="loc-form" onCancel={() => setEdit(null)} saving={saving} submitLabel="Save" />}
      >
        {edit ? (
          <form id="loc-form" onSubmit={onSave} className="space-y-3">
            <div className="text-xs text-muted">{edit.key}</div>
            <Field label="English">
              <input className={fieldClass} value={en} onChange={(e) => setEn(e.target.value)} />
            </Field>
            <Field label="Arabic">
              <input className={fieldClass} value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" />
            </Field>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={createOpen}
        title="Add translation key"
        onClose={() => setCreateOpen(false)}
        footer={<FormActions formId="loc-create" onCancel={() => setCreateOpen(false)} saving={saving} submitLabel="Create" />}
      >
        <form id="loc-create" onSubmit={onCreate} className="space-y-3">
          <Field label="Key">
            <input className={fieldClass} required value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="ui::sidebar.example" />
          </Field>
          <Field label="English">
            <input className={fieldClass} required value={en} onChange={(e) => setEn(e.target.value)} />
          </Field>
          <Field label="Arabic">
            <input className={fieldClass} value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" />
          </Field>
        </form>
      </Modal>
    </>
  );
}
