'use client';

import { useEffect, useState } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import api from '@/lib/api';
import { TOOLS_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { Card } from '@/components/ui';
import { btnPrimary } from '@/lib/ui';
import { formatLogDate } from '@/components/admin/LogCells';

type Tab = 'backup' | 'restore';
type BackupRow = { id: string; filename: string; sizeBytes?: number; size_bytes?: number; createdAt?: string; created_at?: string };

function formatSize(n?: number) {
  const bytes = Number(n || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DatabaseToolsPage() {
  const [tab, setTab] = useState<Tab>('backup');
  const [items, setItems] = useState<BackupRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await api.get('/tools/backups');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function backup() {
    setBusy(true);
    setMsg('');
    try {
      const { data } = await api.post('/tools/backups');
      setMsg(`Backup created: ${data.body?.filename}`);
      await load();
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Backup failed');
    } finally {
      setBusy(false);
    }
  }

  async function restore(id: string) {
    if (!confirm('Restore this backup? Current data will be overwritten.')) return;
    setBusy(true);
    setMsg('');
    try {
      const { data } = await api.post(`/tools/backups/${id}/restore`);
      setMsg(`Restored ${data.body?.filename}`);
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Restore failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminListShell title="Database" icon={<Database className="h-5 w-5 text-plum" />} search="" onSearch={() => undefined} tabs={TOOLS_TABS}>
      <div className="mb-4 flex gap-2 border-b border-border">
        {(['backup', 'restore'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'border-brand text-brand' : 'border-transparent text-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'backup' ? (
        <div className="space-y-4">
          <Card className="border-info/30 bg-info-soft/30 p-4 text-sm text-foreground">
            Creating a backup exports the current database into an SQL file in storage. Keep files in a secure location and generate backups before major updates.
          </Card>
          <div className="flex justify-end">
            <button type="button" className={btnPrimary} onClick={backup} disabled={busy}>
              <Download className="h-4 w-4" /> {busy ? 'Backing up…' : 'Backup'}
            </button>
          </div>
          <h2 className="font-semibold">Latest Backups</h2>
          <AdminPagedTable
            rows={items}
            emptyTitle="No backups found"
            columns={[
              { key: 'name', header: 'Name', render: (r) => r.filename },
              { key: 'size', header: 'Size', render: (r) => formatSize(r.sizeBytes || r.size_bytes) },
              { key: 'at', header: 'Created At', render: (r) => formatLogDate(String(r.createdAt || r.created_at || '')) },
            ]}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 text-sm text-muted">Select a backup below to restore the database to that snapshot.</Card>
          <AdminPagedTable
            rows={items}
            emptyTitle="No backups available to restore"
            columns={[
              { key: 'name', header: 'Name', render: (r) => r.filename },
              { key: 'size', header: 'Size', render: (r) => formatSize(r.sizeBytes || r.size_bytes) },
              { key: 'at', header: 'Created At', render: (r) => formatLogDate(String(r.createdAt || r.created_at || '')) },
              {
                key: 'act',
                header: 'Actions',
                render: (r) => (
                  <button type="button" className="text-sm text-brand" onClick={() => restore(r.id)} disabled={busy}>
                    <Upload className="mr-1 inline h-3.5 w-3.5" /> Restore
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}

      {msg ? <p className="mt-4 text-sm font-medium text-brand">{msg}</p> : null}
    </AdminListShell>
  );
}
