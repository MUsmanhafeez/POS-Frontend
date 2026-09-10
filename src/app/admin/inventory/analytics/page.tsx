'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileText,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, EmptyState } from '@/components/ui';
import { fieldClass, labelOf } from '@/lib/ui';

function AnalyticsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <div className="min-h-[120px]">{children || <EmptyState title="No data available" />}</div>
    </Card>
  );
}

export default function InventoryAnalyticsPage() {
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<{
    low_stock?: unknown[];
    top_suppliers?: Array<{ name: string; amount: number }>;
    stock_movement_summary?: Array<{ type: string; c: number; qty: number }>;
    purchase_order_status?: Array<{ status: string; c: number; amount: number }>;
  } | null>(null);

  useEffect(() => {
    api.get('/branches').then((r) => setBranches(r.data.body || [])).catch(console.error);
  }, []);

  useEffect(() => {
    api
      .get('/inventory/analytics', { params: { branch_id: branchId || undefined, from, to } })
      .then((r) => setData(r.data.body || {}))
      .catch(console.error);
  }, [branchId, from, to]);

  const lowStock = data?.low_stock || [];
  const topSuppliers = data?.top_suppliers || [];
  const movements = data?.stock_movement_summary || [];
  const poStatus = data?.purchase_order_status || [];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Inventory Analytics</h1>
        </div>
        <div className="text-sm text-muted">Home &gt; Inventory Analytics</div>
      </div>

      <Card className="mb-4 p-4">
        <div className="mb-3 text-sm font-semibold text-foreground">Filters</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Branch</label>
            <select className={fieldClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {labelOf(b.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">From</label>
            <input className={fieldClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">To</label>
            <input className={fieldClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <AnalyticsCard title="Fast Moving Ingredients" icon={<Utensils className="h-4 w-4 text-plum" />} />
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard title="Top Suppliers by Purchase Amount" icon={<ShoppingCart className="h-4 w-4 text-plum" />}>
            {topSuppliers.length ? (
              <ul className="space-y-2 text-sm">
                {topSuppliers.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{labelOf(s.name)}</span>
                    <span className="font-medium">JOD {Number(s.amount || 0).toFixed(3)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AnalyticsCard>
          <AnalyticsCard title="Ingredient Purchases Summary" icon={<FileText className="h-4 w-4 text-plum" />}>
            {poStatus.length ? (
              <ul className="space-y-2 text-sm">
                {poStatus.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="capitalize">{s.status}</span>
                    <span>
                      {s.c} · JOD {Number(s.amount || 0).toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AnalyticsCard>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard title="Most Wasted Ingredients" icon={<Trash2 className="h-4 w-4 text-plum" />} />
          <AnalyticsCard title="Low Stock Ingredients" icon={<AlertTriangle className="h-4 w-4 text-plum" />}>
            {lowStock.length ? (
              <ul className="space-y-2 text-sm">
                {(lowStock as Array<{ name: string; quantity: number; unit: string }>).map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{labelOf(s.name)}</span>
                    <span>
                      {s.quantity} {s.unit}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AnalyticsCard>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <AnalyticsCard title="Purchase Order Status Summary" icon={<ClipboardList className="h-4 w-4 text-plum" />}>
            {poStatus.length ? (
              <ul className="space-y-2 text-sm">
                {poStatus.map((s, i) => (
                  <li key={i} className="flex justify-between capitalize">
                    <span>{s.status}</span>
                    <span>{s.c}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AnalyticsCard>
          <AnalyticsCard title="Stock Movement Summary" icon={<TrendingUp className="h-4 w-4 text-plum" />}>
            {movements.length ? (
              <ul className="space-y-2 text-sm">
                {movements.map((m, i) => (
                  <li key={i} className="flex justify-between capitalize">
                    <span>{m.type}</span>
                    <span>
                      {m.c} · {Number(m.qty || 0)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AnalyticsCard>
          <AnalyticsCard title="Wastage & Spoilage" icon={<ClipboardList className="h-4 w-4 text-plum" />} />
        </div>
      </div>
    </div>
  );
}
