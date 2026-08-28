'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Database,
  KeyRound,
  RefreshCw,
  Ticket,
  Activity,
  Wrench,
} from 'lucide-react';
import api from '@/lib/api';
import { SectionTabs } from '@/components/admin/SectionTabs';
import { TOOLS_TABS } from '@/lib/nav';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

const LINKS = [
  { href: '/admin/transfers', label: 'Inter-Branch Transfers', desc: 'Request, approve, and receive stock between branches', icon: ArrowLeftRight },
  { href: '/admin/queue', label: 'Queue / Tokens', desc: 'Issue and call tokens for quick-service counters', icon: Ticket },
  { href: '/admin/tools/database', label: 'Database', desc: 'Backup and restore MySQL database', icon: Database },
  { href: '/admin/activity-logs', label: 'Activity log', desc: 'Tamper-evident audit trail of admin actions', icon: Activity },
  { href: '/admin/roles', label: 'Roles & permissions', desc: 'Edit RBAC permission sets', icon: KeyRound },
];

export default function ToolsPage() {
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [flushResult, setFlushResult] = useState('');
  const [health, setHealth] = useState('');
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [enqueueMsg, setEnqueueMsg] = useState('');

  useEffect(() => {
    api.get('/analytics/insights').then((res) => setInsights(res.data.body)).catch(console.error);
    api
      .get('/app/boot-meta')
      .then((res) => setHealth(`API OK · ${res.data.body?.app_name || 'Forkiva'}`))
      .catch(() => setHealth('API unreachable'));
  }, []);

  async function flush() {
    const { data } = await api.post('/sync/flush');
    setFlushResult(`Flushed ${data.body?.flushed ?? 0} outbox events`);
  }

  async function enqueueTest() {
    await api.post('/sync/enqueue', { event_type: 'manual.test', payload: { at: new Date().toISOString() } });
    setEnqueueMsg('Test event queued');
  }

  async function setManagerPin() {
    await api.post('/auth/set-pin', { pin });
    setPinMsg('Manager PIN updated (use for void/refund approval)');
    setPin('');
  }

  const fraud = (insights?.fraud_signal || {}) as { level?: string; void_rate_pct?: number; score?: number };
  const top = (insights?.top_sellers || []) as Array<{ name: string; qty: number }>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-plum" />
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Tools</h1>
          <p className="text-sm text-muted">Utilities for sync, security PIN, and branch operations.</p>
        </div>
      </div>

      <SectionTabs tabs={[...TOOLS_TABS]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className="rounded-2xl border border-border bg-surface p-4 transition hover:border-brand/40">
              <Icon className="mb-2 h-5 w-5 text-brand" />
              <div className="font-semibold">{l.label}</div>
              <p className="mt-1 text-xs text-muted">{l.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4" /> Offline sync outbox
          </div>
          <p className="text-sm text-muted">Queue local POS events and flush them to the cloud layer.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={enqueueTest}>
              Enqueue test
            </button>
            <button type="button" className={btnPrimary} onClick={flush}>
              Flush outbox
            </button>
          </div>
          {enqueueMsg ? <p className="text-sm text-brand">{enqueueMsg}</p> : null}
          {flushResult ? <p className="text-sm text-brand">{flushResult}</p> : null}
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4" /> Manager PIN
          </div>
          <p className="text-sm text-muted">Required for void/refund/large discount approvals. Default seed PIN: 1234</p>
          <input className={fieldClass} type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="New PIN (min 4)" />
          <button type="button" className={btnPrimary} onClick={setManagerPin} disabled={pin.length < 4}>
            Save PIN
          </button>
          {pinMsg ? <p className="text-sm text-brand">{pinMsg}</p> : null}
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Database className="h-4 w-4" /> System health
          </div>
          <p className="text-sm">{health || 'Checking…'}</p>
        </Card>

        <Card className="space-y-2 p-4">
          <h2 className="font-semibold">Fraud / demand insights</h2>
          <p className="text-sm text-muted">
            Level: <strong className="text-foreground">{fraud.level || 'n/a'}</strong> · void rate {fraud.void_rate_pct ?? 0}% · score{' '}
            {fraud.score ?? 0}
          </p>
          <ul className="text-sm">
            {top.slice(0, 5).map((t) => (
              <li key={t.name}>
                {t.name}: {t.qty}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
