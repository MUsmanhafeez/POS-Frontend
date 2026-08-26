'use client';

import { useMemo, useState } from 'react';
import { Filter, MoreVertical, Search } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { fieldClass } from '@/lib/ui';
import { useT } from '@/stores/locale';

export type AdminColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function AdminListShell({
  title,
  icon,
  action,
  search,
  onSearch,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  search: string;
  onSearch: (v: string) => void;
  children: React.ReactNode;
}) {
  const t = useT();
  const titleLabel = t(title);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{titleLabel}</h1>
        </div>
        <div className="text-sm text-muted">
          {t('Home')} &gt; {titleLabel}
        </div>
      </div>
      {action && <div className="mb-4 flex justify-end">{action}</div>}
      <div className="mb-3 flex justify-end gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className={`${fieldClass} ps-9`}
            placeholder={t('Search here...')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button type="button" className="rounded-xl border border-border px-3 text-muted" aria-label={t('Filter')}>
          <Filter className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

export function AdminPagedTable<T extends { id: string }>({
  rows,
  columns,
  emptyTitle = 'No data available',
  pageSizeOptions = [10, 25, 50],
}: {
  rows: T[];
  columns: AdminColumn<T>[];
  emptyTitle?: string;
  pageSizeOptions?: number[];
}) {
  const t = useT();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] || 10);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = total ? (current - 1) * pageSize + 1 : 0;
  const end = Math.min(current * pageSize, total);
  const slice = useMemo(() => rows.slice((current - 1) * pageSize, current * pageSize), [rows, current, pageSize]);

  if (!rows.length) {
    return (
      <Card>
        <EmptyState title={t(emptyTitle)} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted">
          <span>
            {t('Showing')} 0 {t('to')} 0 {t('of')} 0 {t('entries')}
          </span>
          <span>
            {t('Show')} {pageSize} {t('entries')}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-start text-sm">
          <thead className="bg-surface-muted text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-semibold ${c.className || ''}`}>
                  {t(c.header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-border text-foreground">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle ${c.className || ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted">
        <span>
          {t('Showing')} {start} {t('to')} {end} {t('of')} {total} {t('entries')}
        </span>
        <label className="inline-flex items-center gap-2">
          {t('Show')}
          <select
            className={`${fieldClass} w-auto py-1`}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {t('entries')}
        </label>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-lg border border-border px-2 py-1" disabled={current <= 1} onClick={() => setPage(1)}>
            «
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1"
            disabled={current <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <span className="rounded-lg bg-brand px-2.5 py-1 text-white">{current}</span>
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1"
            disabled={current >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1"
            disabled={current >= pageCount}
            onClick={() => setPage(pageCount)}
          >
            »
          </button>
        </div>
      </div>
    </Card>
  );
}

export function ActionsMenu() {
  const t = useT();
  return (
    <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-surface-muted" aria-label={t('Actions')}>
      <MoreVertical className="h-4 w-4" />
    </button>
  );
}

export function StatusBadge({ value }: { value?: string }) {
  const t = useT();
  const raw = String(value || '—');
  const v = raw.toLowerCase();
  const tone =
    v.includes('paid') || v.includes('active') || v.includes('completed') || v.includes('نشط')
      ? 'success'
      : v.includes('refund') || v.includes('cancel') || v.includes('failed') || v.includes('inactive')
        ? 'danger'
        : v.includes('pending') || v.includes('unpaid')
          ? 'warning'
          : 'brand';
  const label = raw === 'Active' || raw === 'Inactive' ? t(raw) : raw;
  return <Badge tone={tone as 'success' | 'danger' | 'warning' | 'brand'}>{label || '—'}</Badge>;
}

/** keep PageHeader available if needed */
export { PageHeader };
