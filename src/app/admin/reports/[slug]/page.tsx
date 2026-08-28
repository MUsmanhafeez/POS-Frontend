'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary } from '@/lib/ui';
import { reportBySlug } from '@/lib/reports/catalog';

function flattenRows(body: Record<string, unknown>): Array<Record<string, unknown>> {
  if (Array.isArray(body.rows)) return body.rows as Array<Record<string, unknown>>;
  if (Array.isArray(body)) return body as Array<Record<string, unknown>>;
  if (body.summary) return [body.summary as Record<string, unknown>];
  return [];
}

function columnsFromRows(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return [];
  return Object.keys(rows[0]!);
}

export default function ReportDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const def = reportBySlug(slug);

  const [body, setBody] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(() => {
    const q: Record<string, string> = {};
    for (const key of ['branch_id', 'shift_id', 'start_date', 'end_date']) {
      const v = searchParams.get(key);
      if (v) q[key] = v;
    }
    return q;
  }, [searchParams]);

  useEffect(() => {
    if (!def) return;
    setLoading(true);
    setError('');
    api
      .get(`/reports/run/${slug}`, { params: filters })
      .then((res) => setBody(res.data.body || {}))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [slug, def, filters]);

  if (!def) {
    return (
      <div className="space-y-4">
        <p className="text-muted">Report not found.</p>
        <Link href="/admin/reports" className="text-brand">
          Back to reports
        </Link>
      </div>
    );
  }

  const rows = body ? flattenRows(body) : [];
  const cols = columnsFromRows(rows);

  function exportCsv() {
    if (!rows.length) return;
    const header = cols.join(',');
    const lines = rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/reports" className="mb-2 inline-flex items-center gap-1 text-sm text-brand">
            <ArrowLeft className="h-4 w-4" /> All reports
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-plum" />
            <h1 className="text-xl font-bold sm:text-2xl">{def.title}</h1>
          </div>
          <p className="mt-1 text-sm text-muted">{def.description}</p>
        </div>
        <button type="button" className={btnPrimary} onClick={exportCsv} disabled={!rows.length}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <Card className="p-4 text-sm text-muted">
        {filters.start_date || filters.end_date ? (
          <span>
            Period: {filters.start_date || '…'} → {filters.end_date || '…'}
            {filters.branch_id ? ` · Branch ${filters.branch_id}` : ''}
          </span>
        ) : (
          <span>Showing latest available data (apply filters from the reports hub).</span>
        )}
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-muted">Loading report…</Card>
      ) : error ? (
        <Card className="p-8 text-center text-rose-600">{error}</Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          {body?.note ? <p className="border-b border-border px-4 py-2 text-xs text-muted">{String(body.note)}</p> : null}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-muted text-left text-xs uppercase text-muted">
                {cols.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {c.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  {cols.map((c) => (
                    <td key={c} className="px-3 py-2">
                      {typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={Math.max(cols.length, 1)} className="px-3 py-10 text-center text-muted">
                    No data for this report and filter set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
