'use client';

import { Badge } from '@/components/ui';

type Agent = { desktop?: boolean; os?: string; browser?: string };

export function LogUserCell({
  name,
  email,
  role,
}: {
  name?: string;
  email?: string;
  role?: string;
}) {
  const initial = (name || 'U').charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand">
        {initial}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{name || '—'}</span>
          {role ? <Badge tone="plum">{role}</Badge> : null}
        </div>
        <div className="truncate text-xs text-muted">{email || '—'}</div>
      </div>
    </div>
  );
}

export function LogAgentCell({ agent }: { agent?: Agent }) {
  const a = agent || {};
  return (
    <div className="space-y-1 text-xs text-muted min-w-[120px]">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        {a.desktop ? 'Yes' : 'Mobile'}
      </div>
      <div>{a.os || 'Unknown'}</div>
      <div>{a.browser || 'Unknown'}</div>
    </div>
  );
}

export function LogEventBadge({ event }: { event?: string }) {
  const label = (event || 'created').replace(/_/g, ' ');
  const tone: 'success' | 'danger' | 'warning' | 'info' =
    event === 'deleted' ? 'danger' : event === 'updated' ? 'warning' : event === 'login' || event === 'logout' ? 'info' : 'success';
  return <Badge tone={tone}>{label.charAt(0).toUpperCase() + label.slice(1)}</Badge>;
}

export function formatLogDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).replace('T', ' ').slice(0, 19);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
