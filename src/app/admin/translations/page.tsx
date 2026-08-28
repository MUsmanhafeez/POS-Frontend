'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { LOCALIZATION_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Field, FormActions, Modal } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Row = { id: string; key: string; value: Record<string, string> };

export default function TranslationsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Row | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [en, setEn] = useState('');
  const [ar, setAr] = useState('');
  const [saving, setSaving] = useState(false);

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminListShell
        title="Translations"
        icon={<Globe2 className="h-5 w-5 text-plum" />}
        search={search}
        onSearch={setSearch}
        tabs={LOCALIZATION_TABS}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setKeyName('auth.');
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
          rowActions={(row) => ({
            onEdit: () => {
              setEdit(row);
              setEn(row.value?.en || '');
              setAr(row.value?.ar || '');
            },
          })}
          columns={[
            { key: 'key', header: 'Key', render: (r) => <span className="font-mono text-xs text-sky-700">{r.key}</span> },
            {
              key: 'en',
              header: 'English',
              render: (r) => <span className="text-sky-700">{r.value?.en || '—'}</span>,
            },
            {
              key: 'ar',
              header: 'Arabic',
              render: (r) =>
                r.value?.ar ? (
                  <span dir="rtl">{r.value.ar}</span>
                ) : (
                  <span className="italic text-danger">Empty</span>
                ),
            },
          ]}
        />
      </AdminListShell>

      <Modal open={Boolean(edit)} title="Edit translation" onClose={() => setEdit(null)} footer={<FormActions formId="tr-form" onCancel={() => setEdit(null)} saving={saving} submitLabel="Save" />}>
        {edit ? (
          <form id="tr-form" onSubmit={onSave} className="space-y-3">
            <div className="text-xs text-muted">{edit.key}</div>
            <Field label="English"><input className={fieldClass} value={en} onChange={(e) => setEn(e.target.value)} /></Field>
            <Field label="Arabic"><input className={fieldClass} value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" /></Field>
          </form>
        ) : null}
      </Modal>

      <Modal open={createOpen} title="Add translation key" onClose={() => setCreateOpen(false)} footer={<FormActions formId="tr-create" onCancel={() => setCreateOpen(false)} saving={saving} submitLabel="Create" />}>
        <form id="tr-create" onSubmit={onCreate} className="space-y-3">
          <Field label="Key"><input className={fieldClass} required value={keyName} onChange={(e) => setKeyName(e.target.value)} /></Field>
          <Field label="English"><input className={fieldClass} required value={en} onChange={(e) => setEn(e.target.value)} /></Field>
          <Field label="Arabic"><input className={fieldClass} value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" /></Field>
        </form>
      </Modal>
    </>
  );
}
