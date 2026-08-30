'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  ChefHat,
  Clock3,
  LayoutDashboard,
  MonitorSmartphone,
  Package,
  Receipt,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Card, Badge } from '@/components/ui';
import { btnAccent, btnSecondary, fieldClass, labelOf, softPalette } from '@/lib/ui';
import {
  AreaLineChart,
  BarChart,
  DonutChart,
  ForecastBarChart,
  StatSparkline,
  buildDailySeries,
  buildHourlySeries,
  type ChartPoint,
} from '@/components/admin/dashboard/DashboardCharts';

type Overview = {
  currency?: string;
  total_sales: number;
  total_orders: number;
  total_active_orders: number;
  average_order_value: number;
  open_pos_sessions: number;
  unpaid_orders: number;
  void_rate_7d?: number;
  discount_total_7d?: number;
  avg_prep_minutes?: number;
  hourly_sales: { hour: number; total: number; orders: number }[];
  sales_analytics: { day: string; total: number; orders: number }[];
  top_products: { id: string; name: unknown; price: number; sku?: string }[];
  branch_sales: { id: string; name: unknown; total: number; orders: number }[];
  order_types: { label: string; value: number }[];
  order_statuses: { label: string; value: number }[];
  low_stock_items: { id: string; name: string; quantity: number; reorder_level: number; unit?: string }[];
  payments_overview: { label: string; value: number; amount: number }[];
  payment_mix_7d?: Array<{ method: string; txn_count: number; total: number }>;
};

type Insights = {
  demand_forecast?: Array<{ item: string; forecast_qty: number; last_week_qty?: number }>;
  sales_7d?: { total: number; orders: number };
  fraud_signal?: { void_rate_pct?: number; level?: string };
  payment_mix?: Array<{ method: string; total: number; txn_count?: number }>;
};

function money(n: number, currency = 'PKR') {
  const d = currency === 'JOD' ? 3 : 2;
  return `${currency} ${Number(n || 0).toFixed(d)}`;
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface-muted/40 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Overview | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [range, setRange] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/dashboards/overview', { params: { range: range === 'daily' ? 'daily' : range === 'weekly' ? 'weekly' : 'all' } }),
      api.get('/analytics/insights'),
    ])
      .then(([overview, ins]) => {
        setData(overview.data.body);
        setInsights(ins.data.body);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const currency = data?.currency || 'PKR';
  const fmt = (n: number) => money(n, currency);

  const salesTrend: ChartPoint[] = useMemo(
    () => buildDailySeries(data?.sales_analytics || [], 7),
    [data?.sales_analytics]
  );

  const hourlyChart: ChartPoint[] = useMemo(
    () => buildHourlySeries(data?.hourly_sales || []),
    [data?.hourly_sales]
  );

  const paymentMixData: ChartPoint[] = useMemo(() => {
    const fromPayments = (data?.payment_mix_7d || []).filter((p) => Number(p.total) > 0);
    if (fromPayments.length) {
      return fromPayments.map((p) => ({ label: p.method, value: p.total }));
    }
    const fromInsights = (insights?.payment_mix || []).filter((p) => Number(p.total) > 0);
    if (fromInsights.length) {
      return fromInsights.map((p) => ({ label: p.method, value: p.total }));
    }
    const fromStatus = (data?.payments_overview || []).filter((p) => Number(p.amount) > 0);
    if (fromStatus.length) {
      return fromStatus.map((p) => ({ label: p.label, value: p.amount }));
    }
    return [];
  }, [data?.payment_mix_7d, data?.payments_overview, insights?.payment_mix]);

  const orderTypeData: ChartPoint[] = useMemo(
    () => (data?.order_types || []).map((t) => ({ label: t.label, value: t.value })),
    [data?.order_types]
  );

  const forecastRows = useMemo(
    () =>
      (insights?.demand_forecast || []).slice(0, 8).map((r) => ({
        label: String(r.item).slice(0, 28),
        lastWeek: Number(r.last_week_qty || 0),
        forecast: Number(r.forecast_qty || 0),
      })),
    [insights?.demand_forecast]
  );

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total sales',
        value: data ? fmt(data.total_sales) : '—',
        hint: range === 'daily' ? 'Today' : range === 'weekly' ? 'Last 7 days' : 'All time',
        icon: Store,
        spark: salesTrend.map((s) => s.value),
      },
      {
        label: 'Orders',
        value: data?.total_orders ?? '—',
        hint: `${data?.total_active_orders ?? 0} active now`,
        icon: ShoppingBag,
        spark: salesTrend.map((s) => s.value),
      },
      {
        label: 'Average order',
        value: data ? fmt(data.average_order_value) : '—',
        hint: 'Per completed order',
        icon: TrendingUp,
      },
      {
        label: 'Open sessions',
        value: data?.open_pos_sessions ?? '—',
        hint: 'Registers with open shift',
        icon: MonitorSmartphone,
      },
      {
        label: 'Void rate',
        value: data?.void_rate_7d != null ? `${data.void_rate_7d}%` : '—',
        hint: insights?.fraud_signal?.level || '7-day window',
        icon: Receipt,
        alert: (data?.void_rate_7d ?? 0) > 5,
      },
      {
        label: 'Avg prep time',
        value: data?.avg_prep_minutes != null ? `${Number(data.avg_prep_minutes).toFixed(1)} min` : '—',
        hint: 'Kitchen last 7 days',
        icon: Clock3,
      },
    ],
    [data, insights, range, salesTrend, fmt]
  );

  const quickLinks = [
    { label: 'POS', href: '/admin/pos', icon: LayoutDashboard, value: data?.open_pos_sessions },
    { label: 'Kitchen', href: '/admin/kitchen', icon: ChefHat, value: data?.total_active_orders },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, value: data?.total_orders },
    { label: 'Unpaid', href: '/admin/sales/payments', icon: Wallet, value: data?.unpaid_orders, warn: true },
    { label: 'Inventory', href: '/admin/inventory', icon: Boxes, value: data?.low_stock_items?.length },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Users', href: '/admin/users', icon: Users },
  ];

  const greeting = user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard';

  return (
    <div className="space-y-6 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 px-5 py-6 text-white shadow-lg sm:px-8 sm:py-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-100/90">Operations overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}</h1>
            <p className="mt-2 max-w-xl text-sm text-teal-50/80">
              Sales, forecasts, kitchen flow, and branch performance — everything you need to run today&apos;s service.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={`${fieldClass} border-white/20 bg-white/10 py-2 text-white backdrop-blur [&>option]:text-foreground`}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="daily">Today</option>
              <option value="weekly">Last 7 days</option>
              <option value="all">All time</option>
            </select>
            <Link href="/admin/kitchen" className={`${btnSecondary} !border-white/30 !bg-white/10 !text-white hover:!bg-white/20`}>
              Kitchen <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/pos" className={btnAccent}>
              Open POS <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-surface-muted/50">
              <span className="sr-only">Loading</span>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpiCards.map((card, i) => {
              const Icon = card.icon;
              const tone = softPalette[i % softPalette.length];
              return (
                <Card
                  key={card.label}
                  className={`relative overflow-hidden p-4 ring-1 ${tone.ring} ${card.alert ? 'border-warning/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`rounded-xl p-2 ${tone.bg} ${tone.text}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {card.spark?.length ? (
                      <div className={tone.text}>
                        <StatSparkline data={card.spark} />
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{card.label}</div>
                  <div className="mt-1 text-xl font-bold text-foreground tabular-nums">{card.value}</div>
                  <div className="mt-1 text-xs text-muted">{card.hint}</div>
                </Card>
              );
            })}
          </div>

          {/* Main charts */}
          <div className="grid gap-3 lg:grid-cols-5">
            <Panel
              className="lg:col-span-3"
              title="Sales trend"
              subtitle="Paid revenue — last 7 days"
            >
              <AreaLineChart data={salesTrend} height={130} formatValue={(n) => fmt(n)} />
            </Panel>

            <Panel className="lg:col-span-2" title="Payment mix" subtitle="By tender or payment status">
              <DonutChart data={paymentMixData} formatValue={(n) => fmt(n)} compact />
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Hourly sales" subtitle="Today (2-hour buckets)">
              <BarChart data={hourlyChart} height={130} formatValue={(n) => fmt(n)} barClass="bg-gradient-to-t from-teal-700 to-teal-500" />
            </Panel>

            <Panel
              title="Demand forecast"
              subtitle="Same weekday pattern — last week vs projected qty"
              action={
                <Link href="/admin/analytics" className="text-xs font-semibold text-brand hover:underline">
                  Full analytics
                </Link>
              }
            >
              <ForecastBarChart data={forecastRows} />
            </Panel>
          </div>

          {/* Insights row */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Panel title="Top products" subtitle="Recently active menu items">
              {!data?.top_products?.length ? (
                <p className="py-8 text-center text-sm text-muted">No products yet</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_products.slice(0, 6).map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 transition hover:bg-surface-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{labelOf(p.name)}</div>
                          <div className="text-xs text-muted">{p.sku || '—'}</div>
                        </div>
                      </div>
                      <Badge tone="brand">{fmt(p.price)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Order types" subtitle="Distribution by service type">
              <DonutChart data={orderTypeData} compact />
            </Panel>

            <Panel title="Branch performance" subtitle="Paid sales by location">
              {!data?.branch_sales?.length ? (
                <p className="py-8 text-center text-sm text-muted">No branch data</p>
              ) : (
                <ul className="space-y-2">
                  {[...data.branch_sales]
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 6)
                    .map((b, i) => (
                      <li key={b.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                        <span className="font-medium text-foreground">
                          <span className="text-muted">#{i + 1}</span> {labelOf(b.name)}
                        </span>
                        <span className="text-right text-xs">
                          <span className="font-bold text-foreground">{fmt(b.total)}</span>
                          <span className="text-muted"> · {b.orders} orders</span>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Alerts + quick nav */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Alerts" subtitle="Items needing attention" className="lg:col-span-1">
              <div className="space-y-3">
                {(data?.unpaid_orders ?? 0) > 0 && (
                  <Link
                    href="/admin/sales/payments"
                    className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft/40 px-3 py-3 transition hover:bg-warning-soft/60"
                  >
                    <Wallet className="h-5 w-5 text-warning shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{data?.unpaid_orders} unpaid orders</div>
                      <div className="text-xs text-muted">Review payments</div>
                    </div>
                  </Link>
                )}
                {data?.low_stock_items?.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft/30 px-3 py-2.5"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.name}</div>
                      <div className="text-xs text-muted">
                        {item.quantity} {item.unit || ''} left · reorder at {item.reorder_level}
                      </div>
                    </div>
                  </div>
                ))}
                {!data?.low_stock_items?.length && !(data?.unpaid_orders ?? 0) && (
                  <p className="py-6 text-center text-sm text-muted">All clear — no urgent alerts</p>
                )}
              </div>
            </Panel>

            <Panel title="Quick actions" subtitle="Jump to key modules" className="lg:col-span-2">
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                {quickLinks.map((link, i) => {
                  const Icon = link.icon;
                  const tone = softPalette[i % softPalette.length];
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:-translate-y-0.5 hover:shadow-md ring-1 ${tone.ring} ${link.warn && (link.value ?? 0) > 0 ? 'border-warning/40' : ''}`}
                    >
                      <div className={`rounded-lg p-2 ${tone.bg} ${tone.text}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-brand">{link.label}</div>
                        {link.value != null ? (
                          <div className="text-xs text-muted tabular-nums">{link.value}</div>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
