'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { ACTIVITIES_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { LogAgentCell, LogUserCell, formatLogDate } from '@/components/admin/LogCells';
import { btnPrimary } from '@/lib/ui';

type Row = {
  id: string;
  userName?: string;
  user_name?: string;
  userEmail?: string;
  user_email?: string;
  userRole?: string;
  user_role?: string;
  ip?: string;
  agent?: { desktop?: boolean; os?: string; browser?: string };
  loginAt?: string;
  login_at?: string;
  logoutAt?: string;
  logout_at?: string;
};

export default function AuthenticationLogsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');

  async function load() {
    const { data } = await api.get('/authentication-logs', { params: { search, limit: 200 } });
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <AdminListShell
      title="Authentication Logs"
      icon={<ShieldCheck className="h-5 w-5 text-plum" />}
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
        emptyTitle="No authentication logs yet"
        columns={[
          {
            key: 'user',
            header: 'User',
            render: (r) => (
              <LogUserCell
                name={r.userName || r.user_name}
                email={r.userEmail || r.user_email}
                role={r.userRole || r.user_role}
              />
            ),
          },
          { key: 'agent', header: 'Agent', render: (r) => <LogAgentCell agent={r.agent} /> },
          { key: 'ip', header: 'IP Address', render: (r) => r.ip || '127.0.0.1' },
          {
            key: 'login',
            header: 'Login At',
            render: (r) => formatLogDate(String(r.loginAt || r.login_at || '')),
          },
          {
            key: 'logout',
            header: 'Logout At',
            render: (r) => {
              const v = r.logoutAt || r.logout_at;
              return v ? formatLogDate(String(v)) : '—';
            },
          },
        ]}
      />
    </AdminListShell>
  );
}
