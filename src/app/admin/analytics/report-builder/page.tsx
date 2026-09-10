'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Download, Play } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Branch = { id: string; name: unknown };
type ReportRow = {
  item_name?: string;
  group_key: string;
  qty: number;
  revenue: number;
  hour?: number;
  period_label?: string;
  multiplier_vs_baseline?: number;
};

export default function ReportBuilderPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [date, setDate] = useState(today);
  const [branchId, setBranchId] = useState('');
  const [compareYears, setCompareYears] = useState(1);
  const [timeMode, setTimeMode] = useState<'all' | 'preset' | 'after'>('all');
  const [timePreset, setTimePreset] = useState('late_night');
  const [afterHour, setAfterHour] = useState(23);
  const [itemFilter, setItemFilter] = useState('');
  const [reportType, setReportType] = useState<'item_comparison' | 'item_ranking' | 'hourly_breakdown'>('item_ranking');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<{ id: string; name: string; spec: Record<string, unknown> }[]>([]);

  useEffect(() => {
    api.get('/branches').then((r) => setBranches(r.data.body || []));
    api.get('/analytics/report/presets').then((r) => {
      setPresets(r.data.body?.report_templates || []);
    });
  }, []);

  function buildSpec(extra?: Record<string, unknown>) {
    const time_window =
      timeMode === 'all'
        ? undefined
        : timeMode === 'preset'
          ? { preset_code: timePreset, start_hour: 23, end_hour: 6, wraps_midnight: true }
          : { start_hour: afterHour, end_hour: (afterHour + 6) % 24, wraps_midnight: afterHour >= 20 };

    const compare_periods = [];
    for (let y = 1; y <= compareYears; y++) {
      const d = new Date(date + 'T12:00:00');
      d.setFullYear(d.getFullYear() - y);
      compare_periods.push({
        type: 'single_date',
        date: d.toISOString().slice(0, 10),
        label: `${y} year ago`,
        time_window,
      });
    }

    return {
      report_type: reportType,
      primary_period: {
        type: 'single_date',
        date,
        label: 'Selected date',
        time_window,
      },
      compare_periods: reportType === 'item_comparison' ? compare_periods : undefined,
      baseline_period:
        reportType === 'item_comparison'
          ? {
              type: 'date_range',
              start: new Date(new Date(date).setDate(new Date(date).getDate() - 30))
                .toISOString()
                .slice(0, 10),
              end: new Date(new Date(date).setDate(new Date(date).getDate() - 1))
                .toISOString()
                .slice(0, 10),
              label: '30 days before',
            }
          : undefined,
      filters: {
        branch_id: branchId || undefined,
        item_name_contains: itemFilter || undefined,
      },
      ranking: reportType === 'item_ranking' ? { by: 'qty', order: 'desc', limit: 25 } : undefined,
      include_bottom: reportType === 'item_ranking',
      group_by: reportType === 'hourly_breakdown' ? ['hour'] : ['item_name'],
      ...extra,
    };
  }

  async function runReport(specOverride?: Record<string, unknown>) {
    setLoading(true);
    try {
      const spec = specOverride || buildSpec();
      const { data } = await api.post('/analytics/report', spec);
      setRows(data.body?.rows || []);
      setSummary(data.body?.summary || '');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = 'item,qty,revenue,hour,period,multiplier';
    const lines = rows.map((r) =>
      [r.item_name || r.group_key, r.qty, r.revenue, r.hour ?? '', r.period_label ?? '', r.multiplier_vs_baseline ?? ''].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report-${date}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-xl font-bold">Report Builder</h1>
            <p className="text-sm text-muted">SQL comparison reports — date, time-of-day, branch, YoY.</p>
          </div>
        </div>
        <Link href="/admin/analytics" className="text-sm text-brand hover:underline">← Analytics</Link>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
              onClick={() => runReport(p.spec)}
            >
              {labelOf(p.name)}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="font-semibold">Date</span>
            <input type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Branch</span>
            <select className={fieldClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Report type</span>
            <select className={fieldClass} value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)}>
              <option value="item_ranking">Item ranking (top/bottom)</option>
              <option value="item_comparison">YoY comparison</option>
              <option value="hourly_breakdown">Hourly breakdown</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Compare years back</span>
            <input type="number" min={0} max={5} className={fieldClass} value={compareYears} onChange={(e) => setCompareYears(Number(e.target.value))} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Time filter</span>
            <select className={fieldClass} value={timeMode} onChange={(e) => setTimeMode(e.target.value as typeof timeMode)}>
              <option value="all">All day</option>
              <option value="preset">Preset (late night / iftar)</option>
              <option value="after">After hour</option>
            </select>
          </label>
          {timeMode === 'preset' && (
            <label className="block text-sm">
              <span className="font-semibold">Preset</span>
              <select className={fieldClass} value={timePreset} onChange={(e) => setTimePreset(e.target.value)}>
                <option value="late_night">Late night (after 11pm)</option>
                <option value="iftar_window">Iftar window</option>
                <option value="lunch_rush">Lunch rush</option>
              </select>
            </label>
          )}
          {timeMode === 'after' && (
            <label className="block text-sm">
              <span className="font-semibold">After hour (0–23)</span>
              <input type="number" min={0} max={23} className={fieldClass} value={afterHour} onChange={(e) => setAfterHour(Number(e.target.value))} />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-semibold">Item contains</span>
            <input className={fieldClass} value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} placeholder="e.g. Mutton" />
          </label>
        </div>

        <div className="flex gap-2">
          <button type="button" className={btnPrimary} disabled={loading} onClick={() => runReport()}>
            <Play className="h-4 w-4" /> {loading ? 'Running…' : 'Run report'}
          </button>
          {rows.length > 0 && (
            <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={exportCsv}>
              <Download className="h-4 w-4 inline" /> CSV
            </button>
          )}
        </div>
      </Card>

      {summary && (
        <Card className="p-4 bg-brand-soft/30">
          <p className="text-sm font-medium">{summary}</p>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Revenue</th>
              <th className="p-3">Hour</th>
              <th className="p-3">Period</th>
              <th className="p-3">× Baseline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-3">{labelOf(r.item_name || r.group_key)}</td>
                <td className="p-3 font-semibold">{r.qty}</td>
                <td className="p-3">{Number(r.revenue).toFixed(2)}</td>
                <td className="p-3">{r.hour != null ? `${r.hour}:00` : '—'}</td>
                <td className="p-3 text-muted">{r.period_label || '—'}</td>
                <td className="p-3">{r.multiplier_vs_baseline != null ? r.multiplier_vs_baseline.toFixed(2) : '—'}</td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">Run a report to see results.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
