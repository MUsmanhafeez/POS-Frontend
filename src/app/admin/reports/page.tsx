'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Filter, Search } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';
import { REPORT_CATALOG, REPORT_CATEGORIES } from '@/lib/reports/catalog';

type Branch = { id: string; name: unknown };

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    api.get('/branches').then((res) => setBranches(res.data.body || [])).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return REPORT_CATALOG;
    return REPORT_CATALOG.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [search]);

  const query = new URLSearchParams();
  if (branchId) query.set('branch_id', branchId);
  if (shiftId) query.set('shift_id', shiftId);
  if (startDate) query.set('start_date', startDate);
  if (endDate) query.set('end_date', endDate);
  const qs = query.toString();

  function clearFilters() {
    setBranchId('');
    setShiftId('');
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setSearch('');
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold sm:text-2xl">Reports</h1>
        </div>
        <p className="mt-1 text-sm text-muted">Sales, product mix, tax, payments, inventory, and POS reports for every branch.</p>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" /> Report Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-bold text-muted">
            Branch
            <select className={`${fieldClass} mt-1`} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {typeof b.name === 'object' ? (b.name as { en?: string }).en : String(b.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-muted">
            Shift
            <input className={`${fieldClass} mt-1`} value={shiftId} onChange={(e) => setShiftId(e.target.value)} placeholder="Optional shift id" />
          </label>
          <label className="text-xs font-bold text-muted">
            Start Date
            <input type="date" className={`${fieldClass} mt-1`} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="text-xs font-bold text-muted">
            End Date
            <input type="date" className={`${fieldClass} mt-1`} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <div className="flex items-end">
            <button type="button" className={btnPrimary} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search reports…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </Card>

      {REPORT_CATEGORIES.map((cat) => {
        const items = filtered.filter((r) => r.category === cat.id);
        if (!items.length) return null;
        return (
          <section key={cat.id}>
            <h2 className="mb-3 text-base font-bold">{cat.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((report) => {
                const Icon = report.icon;
                return (
                  <Link
                    key={report.slug}
                    href={`/admin/reports/${report.slug}${qs ? `?${qs}` : ''}`}
                    className="group flex gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand/40 hover:shadow-sm"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft/50 text-brand group-hover:bg-brand-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{report.title}</div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{report.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
