'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Play } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Upcoming = {
  instance_id: string;
  occasion_code: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  days_until: number;
  prep_lead_days: number;
};

type ReadinessRow = {
  item_name: string;
  branch_name: string;
  avg_multiplier: number;
  order_increase_pct: number;
  suggested_order_date: string;
  vendor_note: string;
  drop_off_warning: string;
};

export default function SeasonalReadinessPage() {
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [instanceId, setInstanceId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [report, setReport] = useState<{
    occasion_name?: string;
    summary?: string;
    rows?: ReadinessRow[];
    ibt_suggestions?: Array<{ item_name: string; from_branch_id: string; to_branch_id: string; reason: string }>;
    forecast_run_id?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/occasions/upcoming').then((r) => {
      const list = r.data.body || [];
      setUpcoming(list);
      if (list[0]) setInstanceId(list[0].instance_id);
    });
    api.get('/branches').then((r) => setBranches(r.data.body || []));
  }, []);

  async function generate() {
    if (!instanceId) return;
    setLoading(true);
    try {
      const q = branchId ? `?branch_id=${branchId}` : '';
      const { data } = await api.get(`/occasions/readiness-report/${instanceId}${q}`);
      setReport(data.body);
    } finally {
      setLoading(false);
    }
  }

  async function createPr() {
    if (!report?.forecast_run_id) return;
    await api.post('/purchase-requisitions/from-forecast', { forecast_run_id: report.forecast_run_id });
    alert('Purchase requisition created from forecast.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-xl font-bold">Seasonal Readiness</h1>
            <p className="text-sm text-muted">Occasion-based stock recommendations from historical SQL analysis.</p>
          </div>
        </div>
        <Link href="/admin/analytics/report-builder" className="text-sm text-brand hover:underline">Report Builder</Link>
      </div>

      {upcoming.filter((u) => u.days_until <= u.prep_lead_days).length > 0 && (
        <Card className="border-warning/40 bg-warning-soft p-4">
          <p className="font-semibold text-warning">Upcoming occasions within prep window</p>
          <ul className="mt-2 text-sm">
            {upcoming
              .filter((u) => u.days_until <= u.prep_lead_days)
              .map((u) => (
                <li key={u.instance_id}>{labelOf(u.name)} — {u.days_until} days until start</li>
              ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-semibold">Occasion</span>
            <select className={fieldClass} value={instanceId} onChange={(e) => setInstanceId(e.target.value)}>
              {upcoming.map((u) => (
                <option key={u.instance_id} value={u.instance_id}>
                  {labelOf(u.name)} {u.year} ({u.start_date})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Branch</span>
            <select className={fieldClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All (no PR)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" className={btnPrimary} disabled={loading} onClick={generate}>
              <Play className="h-4 w-4" /> Generate
            </button>
            {report?.forecast_run_id && (
              <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={createPr}>
                Create suggested PR
              </button>
            )}
          </div>
        </div>
      </Card>

      {report?.summary && (
        <Card className="p-4 bg-brand-soft/20">
          <p className="text-sm font-medium">{report.summary}</p>
        </Card>
      )}

      {report?.rows && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Avg multiplier</th>
                <th className="p-3">Order increase</th>
                <th className="p-3">Order by</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">{labelOf(r.item_name)}</td>
                  <td className="p-3">{labelOf(r.branch_name)}</td>
                  <td className="p-3 font-semibold">{r.avg_multiplier}x</td>
                  <td className="p-3">+{r.order_increase_pct}%</td>
                  <td className="p-3">{r.suggested_order_date}</td>
                  <td className="p-3 text-muted text-xs">{r.vendor_note} {r.drop_off_warning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {report?.ibt_suggestions?.length ? (
        <Card className="p-4">
          <h2 className="font-bold mb-2">Cross-branch transfer suggestions</h2>
          <ul className="text-sm space-y-1">
            {report.ibt_suggestions.map((s, i) => (
              <li key={i}>{labelOf(s.item_name)}: move stock toward high-demand branch — {s.reason}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
