'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarClock,
  ChefHat,
  Clock3,
  FolderOpen,
  Grid2x2,
  Image as ImageIcon,
  LayoutDashboard,
  MapPinned,
  MonitorSmartphone,
  Package,
  Receipt,
  ShoppingBag,
  Store,
  Tag,
  Users,
  Wallet,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, PageHeader, Badge } from '@/components/ui';
import { btnAccent, btnSecondary, fieldClass, labelOf, softPalette } from '@/lib/ui';

type Overview = {
  currency?: string;
  total_sales: number;
  total_orders: number;
  total_active_orders: number;
  average_order_value: number;
  total_users: number;
  total_menus: number;
  total_products: number;
  total_categories: number;
  total_branches: number;
  total_registers: number;
  total_shifts: number;
  total_shift_sessions: number;
  open_pos_sessions: number;
  total_floors: number;
  total_zones: number;
  total_tables: number;
  total_table_merges: number;
  total_options: number;
  total_online_menus: number;
  total_inventory_items: number;
  low_stock_count: number;
  total_promotions: number;
  total_discounts: number;
  total_vouchers: number;
  total_media: number;
  total_invoices: number;
  unpaid_orders: number;
  hourly_sales: { hour: number; total: number; orders: number }[];
  sales_analytics: { day: string; total: number; orders: number }[];
  top_products: { id: string; name: unknown; price: number; sku?: string }[];
  branch_sales: { id: string; name: unknown; total: number; orders: number }[];
  order_types: { label: string; value: number }[];
  order_statuses: { label: string; value: number }[];
  low_stock_items: { id: string; name: string; quantity: number; reorder_level: number; unit?: string }[];
  payments_overview: { label: string; value: number; amount: number }[];
};

function money(n: number, currency = 'JOD') {
  return `${currency} ${Number(n || 0).toFixed(3)}`;
}

function EmptyState({ text = 'No data available' }: { text?: string }) {
  return <p className="py-10 text-center text-sm font-medium text-muted">{text}</p>;
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted/40 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </Card>
  );
}

function MiniBars({
  items,
  valueKey = 'total',
}: {
  items: Array<Record<string, unknown>>;
  valueKey?: string;
}) {
  if (!items.length) return <EmptyState />;
  const max = Math.max(...items.map((i) => Number(i[valueKey] || 0)), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const value = Number(item[valueKey] || 0);
        const label = String(item.label ?? item.day ?? item.hour ?? `#${idx + 1}`);
        return (
          <div key={`${label}-${idx}`}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{label}</span>
              <span className="text-muted">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(6, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [salesRange, setSalesRange] = useState('weekly');
  const [topRange, setTopRange] = useState('all');

  useEffect(() => {
    api
      .get('/dashboards/overview', { params: { range: topRange === 'weekly' ? 'weekly' : 'all' } })
      .then((res) => setData(res.data.body))
      .catch(console.error);
  }, [topRange]);

  const currency = data?.currency || 'JOD';

  const primaryCards = useMemo(
    () => [
      { label: 'Total Sales', value: data ? money(data.total_sales, currency) : '—', icon: Store },
      { label: 'Total Orders', value: data?.total_orders ?? '—', icon: ShoppingBag },
      { label: 'Total Active Orders', value: data?.total_active_orders ?? '—', icon: Receipt },
      { label: 'Average Order Value', value: data ? money(data.average_order_value, currency) : '—', icon: LayoutDashboard },
      { label: 'Total Users', value: data?.total_users ?? '—', icon: Users },
      { label: 'Total Menus', value: data?.total_menus ?? '—', icon: Grid2x2 },
      { label: 'Total Products', value: data?.total_products ?? '—', icon: Package },
      { label: 'Total Categories', value: data?.total_categories ?? '—', icon: FolderOpen },
    ],
    [data, currency]
  );

  const moduleCards = useMemo(
    () => [
      { label: 'Branches', value: data?.total_branches ?? 0, href: '/admin/branches', icon: Building2 },
      { label: 'Registers', value: data?.total_registers ?? 0, href: '/admin/registers', icon: MonitorSmartphone },
      { label: 'Open POS Sessions', value: data?.open_pos_sessions ?? 0, href: '/admin/pos/opening-closing', icon: Clock3 },
      { label: 'Shifts', value: data?.total_shifts ?? 0, href: '/admin/shifts', icon: CalendarClock },
      { label: 'Shift Sessions', value: data?.total_shift_sessions ?? 0, href: '/admin/shift-sessions', icon: CalendarClock },
      { label: 'Options', value: data?.total_options ?? 0, href: '/admin/options', icon: Grid2x2 },
      { label: 'Floors', value: data?.total_floors ?? 0, href: '/admin/seating/floors', icon: MapPinned },
      { label: 'Zones', value: data?.total_zones ?? 0, href: '/admin/seating/zones', icon: MapPinned },
      { label: 'Tables', value: data?.total_tables ?? 0, href: '/admin/seating/tables', icon: MapPinned },
      { label: 'Ingredients', value: data?.total_inventory_items ?? 0, href: '/admin/inventory', icon: Boxes },
      { label: 'Low Stock', value: data?.low_stock_count ?? 0, href: '/admin/inventory', icon: Boxes },
      { label: 'Discounts', value: data?.total_discounts ?? 0, href: '/admin/promotions', icon: Tag },
      { label: 'Media', value: data?.total_media ?? 0, href: '/admin/media', icon: ImageIcon },
      { label: 'Invoices', value: data?.total_invoices ?? 0, href: '/admin/sales/invoices', icon: Receipt },
      { label: 'Unpaid Orders', value: data?.unpaid_orders ?? 0, href: '/admin/sales/payments', icon: Wallet },
      { label: 'Kitchen', value: data?.total_active_orders ?? 0, href: '/admin/kitchen', icon: ChefHat },
    ],
    [data]
  );

  const hourly = (data?.hourly_sales || []).map((h) => ({
    label: `${String(h.hour).padStart(2, '0')}:00`,
    total: h.total,
  }));

  const salesAnalytics = (data?.sales_analytics || []).map((d) => ({
    label: String(d.day).slice(5),
    total: d.total,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Sales, POS, menus, seating, inventory, and promotions at a glance."
        action={
          <>
            <Link href="/admin/kitchen" className={btnSecondary}>
              Kitchen <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/pos" className={btnAccent}>
              Open POS <ArrowUpRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primaryCards.map((card, i) => {
          const Icon = card.icon;
          const tone = softPalette[i % softPalette.length];
          return (
            <Card key={card.label} className={`p-4 ring-1 ${tone.ring}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{card.label}</div>
                <div className={`rounded-xl p-2.5 ${tone.bg} ${tone.text}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-foreground">{card.value}</div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {moduleCards.map((card, i) => {
          const Icon = card.icon;
          const tone = softPalette[i % softPalette.length];
          return (
            <Link key={card.label} href={card.href}>
              <Card className={`h-full p-4 transition hover:-translate-y-0.5 hover:shadow-md ring-1 ${tone.ring}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{card.label}</div>
                  <div className={`rounded-lg p-2 ${tone.bg} ${tone.text}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold text-foreground">{card.value}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4">
        <Panel title="Hourly Sales Trend">
          <MiniBars items={hourly} />
        </Panel>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Sales Analytics"
            action={
              <select className={`${fieldClass} w-auto py-1.5 text-xs`} value={salesRange} onChange={(e) => setSalesRange(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="all">All The Time</option>
              </select>
            }
          >
            <MiniBars items={salesRange === 'weekly' ? salesAnalytics : salesAnalytics} />
          </Panel>

          <Panel
            title="Top Selling Products"
            action={
              <select className={`${fieldClass} w-auto py-1.5 text-xs`} value={topRange} onChange={(e) => setTopRange(e.target.value)}>
                <option value="all">All The Time</option>
                <option value="weekly">Weekly</option>
              </select>
            }
          >
            {!data?.top_products?.length ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {data.top_products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{labelOf(p.name)}</div>
                      <div className="text-xs text-muted">{p.sku || '—'}</div>
                    </div>
                    <Badge tone="brand">{money(p.price, currency)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Branch Wise Sales Comparison">
            {!data?.branch_sales?.length ? (
              <EmptyState />
            ) : (
              <MiniBars
                items={data.branch_sales.map((b) => ({ label: labelOf(b.name), total: b.total }))}
              />
            )}
          </Panel>
          <Panel title="Best Performing Branches">
            {!data?.branch_sales?.length ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {[...data.branch_sales]
                  .sort((a, b) => b.total - a.total)
                  .map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                      <span className="font-semibold text-foreground">
                        #{i + 1} {labelOf(b.name)}
                      </span>
                      <span className="text-muted">
                        {money(b.total, currency)} · {b.orders} orders
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Panel title="Order Type Distribution">
            <MiniBars items={(data?.order_types || []).map((x) => ({ label: x.label, total: x.value }))} />
          </Panel>
          <Panel title="Order Total By Status">
            <MiniBars items={(data?.order_statuses || []).map((x) => ({ label: x.label, total: x.value }))} />
          </Panel>
          <Panel title="Low Stock Alerts">
            {!data?.low_stock_items?.length ? (
              <EmptyState text="No low stock items" />
            ) : (
              <div className="space-y-2">
                {data.low_stock_items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-warning/30 bg-warning-soft/40 px-3 py-2 text-sm">
                    <div className="font-semibold text-foreground">{item.name}</div>
                    <div className="text-xs text-muted">
                      Qty {item.quantity} {item.unit || ''} · reorder {item.reorder_level}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Payments Overview">
            <MiniBars
              items={(data?.payments_overview || []).map((x) => ({
                label: `${x.label} (${money(x.amount, currency)})`,
                total: x.value,
              }))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
