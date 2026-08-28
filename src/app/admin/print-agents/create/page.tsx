'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu } from 'lucide-react';
import api from '@/lib/api';
import { SectionTabs } from '@/components/admin/SectionTabs';
import { PRINTERS_TABS } from '@/lib/nav';
import { Card, Field } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

export default function CreatePrintAgentPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [form, setForm] = useState({
    name: '',
    branch_id: '',
    is_active: true,
    api_key: '',
    host: '',
    port: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/branches').then((res) => setBranches(res.data.body || [])).catch(console.error);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/print-agents', { ...form, port: form.port ? Number(form.port) : null });
      router.push('/admin/print-agents');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold">Create Print Agent</h1>
        </div>
        <Link href="/admin/print-agents" className="text-sm text-brand">
          Cancel
        </Link>
      </div>

      <SectionTabs tabs={[...PRINTERS_TABS]} />

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-3 p-4">
          <h2 className="font-semibold">Print Agent information</h2>
          <Field label="Name (English)">
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Branch">
            <select className={fieldClass} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {labelOf(b.name)}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-semibold">Qintrix Integration</h2>
          <Field label="API Key">
            <input className={fieldClass} value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Host">
              <input className={`${fieldClass} sm:col-span-2`} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
            </Field>
            <Field label="Port">
              <input className={fieldClass} type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/admin/print-agents" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
