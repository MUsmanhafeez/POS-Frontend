'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import api from '@/lib/api';
import { ACTIVITIES_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { LogAgentCell, LogEventBadge, LogUserCell, formatLogDate } from '@/components/admin/LogCells';
import { btnPrimary } from '@/lib/ui';

type Row = {
  id: string;
  action?: string;
  log_name?: string;
  event?: string;
  subject?: string;
  actorName?: string;
  actor_name?: string;
  actorEmail?: string;
  actor_email?: string;
  actorRole?: string;
  actor_role?: string;
  ip?: string;
  agent?: { desktop?: boolean; os?: string; browser?: string };
  createdAt?: string;
  created_at?: string;
  logged_at?: string;
};

export default function ActivityLogsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');

  async function load() {
    const { data } = await api.get('/activities', { params: { search, limit: 200 } });
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <AdminListShell
      title="Activity Logs"
      icon={<Activity className="h-5 w-5 text-plum" />}
      search={search}
      onSearch={setSearch}
      tabs={ACTIVITIES_TABS}
      action={
        <button type="button" className={btnPrimary} onClick={() => load()}>
          Refresh
        </button>
      }
    >
      <AdminPagedTable
        rows={items}
        emptyTitle="No activity logs yet"
        columns={[
          {
            key: 'user',
            header: 'User',
            render: (r) => (
              <LogUserCell
                name={r.actorName || r.actor_name}
                email={r.actorEmail || r.actor_email}
                role={r.actorRole || r.actor_role}
              />
            ),
          },
          { key: 'ip', header: 'IP Address', render: (r) => r.ip || '127.0.0.1' },
          { key: 'agent', header: 'Agent', render: (r) => <LogAgentCell agent={r.agent} /> },
          {
            key: 'log',
            header: 'Log Name',
            render: (r) => (
              <span className="font-mono text-xs text-sky-700">{r.log_name || r.action || '—'}</span>
            ),
          },
          { key: 'event', header: 'Event', render: (r) => <LogEventBadge event={r.event} /> },
          { key: 'subject', header: 'Subject', render: (r) => r.subject || '—' },
          {
            key: 'when',
            header: 'Logged at',
            render: (r) => formatLogDate(String(r.logged_at || r.createdAt || r.created_at || '')),
          },
        ]}
      />
    </AdminListShell>
  );
}
