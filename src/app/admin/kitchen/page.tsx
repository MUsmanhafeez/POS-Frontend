'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  Check,
  CheckCheck,
  ChefHat,
  Circle,
  CircleCheck,
  Clock3,
  Inbox,
  Loader2,
  Menu,
  Monitor,
  RefreshCw,
  Salad,
  Search,
} from 'lucide-react';
import api from '@/lib/api';
import { labelOf } from '@/lib/ui';
import { useAuthStore } from '@/stores/auth';

type Branch = { id: string; name: unknown };
type KitchenProduct = {
  id: string;
  quantity: number;
  name: unknown;
  special_instructions?: string | null;
  status?: { id: string; name: string; color?: string };
  next_status?: { id: string; raw: string } | null;
};
type KitchenOrder = {
  id: string;
  order_number: string;
  reference_no?: string;
  created_at?: string;
  updated_at?: string;
  time?: string;
  created_ago?: string;
  status_duration?: string;
  type?: { id: string; name: string };
  table?: { name: unknown } | null;
  payment_status?: { id: string; name: string };
  status?: { id: string; name: string };
  products_count?: number;
  products: KitchenProduct[];
};

const COLUMNS = [
  { id: 'confirmed', label: 'Confirmed', color: '#3B82F6', Icon: Check },
  { id: 'preparing', label: 'Preparing', color: '#8B5CF6', Icon: ChefHat },
  { id: 'ready', label: 'Ready', color: '#10B981', Icon: BellRing },
  { id: 'served', label: 'Served', color: '#14B8A6', Icon: CheckCheck },
] as const;

const MOVE_LABELS: Record<string, string> = {
  confirmed: 'Start Preparing',
  preparing: 'Mark as Ready',
  ready: 'Mark as Served',
};

const ORDER_TYPES = [
  { id: '', name: 'Select Order Type' },
  { id: 'dine_in', name: 'Dine In' },
  { id: 'takeaway', name: 'Takeaway' },
  { id: 'delivery', name: 'Delivery' },
];

export default function KitchenPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [orderType, setOrderType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    const { data } = await api.get('/branches');
    const list = (data.body || []) as Branch[];
    setBranches(list);
    if (!branchId && list.length) {
      const preferred =
        user?.branch_id && list.some((b) => b.id === user.branch_id) ? user.branch_id : list[0].id;
      setBranchId(preferred);
    }
  }, [branchId, user?.branch_id]);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (!branchId) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const { data } = await api.get('/kitchen/viewer/orders', {
          params: {
            branch_id: branchId,
            ...(orderType ? { type: orderType } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });
        setOrders(data.body?.orders || []);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId, orderType, search]
  );

  useEffect(() => {
    loadBranches().catch(console.error);
  }, [loadBranches]);

  useEffect(() => {
    if (!branchId) return;
    loadOrders().catch(console.error);
    const t = setInterval(() => loadOrders(true).catch(console.error), 5000);
    return () => clearInterval(t);
  }, [branchId, loadOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.reference_no?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const byColumn = useMemo(() => {
    const map: Record<string, KitchenOrder[]> = {
      confirmed: [],
      preparing: [],
      ready: [],
      served: [],
    };
    for (const order of filtered) {
      const id = order.status?.id || 'confirmed';
      if (map[id]) map[id].push(order);
      else map.confirmed.push(order);
    }
    return map;
  }, [filtered]);

  async function advance(order: KitchenOrder) {
    const movable = (order.products || []).filter((p) => p.next_status);
    if (!movable.length || advancingId) return;
    setAdvancingId(order.id);
    try {
      await api.post(`/kitchen/viewer/${order.id}/advance`, { ids: movable.map((p) => p.id) });
      await loadOrders(true);
    } finally {
      setAdvancingId(null);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#f8f9fa] text-slate-900">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <Link
          href="/admin"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Back to admin"
        >
          <Menu className="h-5 w-5" />
        </Link>

        <button
          type="button"
          disabled={!branchId || loading || refreshing}
          onClick={() => loadOrders(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative min-w-[180px] flex-1 sm:max-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order num"
            className="h-10 w-full rounded-xl border-0 bg-slate-100 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-10 min-w-[160px] rounded-xl border-0 bg-slate-100 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200"
        >
          {!branches.length ? <option value="">No branches</option> : null}
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {labelOf(b.name) || b.id}
            </option>
          ))}
        </select>

        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          disabled={!branchId}
          className="h-10 min-w-[170px] rounded-xl border-0 bg-slate-100 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
        >
          {ORDER_TYPES.map((t) => (
            <option key={t.id || 'all'} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <div className="ml-auto hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          Kitchen Viewer
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
        {loading && !orders.length ? (
          <div className="grid h-full place-items-center text-slate-400">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading kitchen board…
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-x-auto md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const list = byColumn[col.id] || [];
              const Icon = col.Icon;
              return (
                <section key={col.id} className="flex min-h-0 min-w-[260px] flex-col overflow-hidden rounded-xl bg-[#f1f3f5]">
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                      <Icon className="h-[18px] w-[18px]" style={{ color: col.color }} />
                      <span>{col.label}</span>
                    </div>
                    <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-600">
                      {list.length}
                    </span>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                    {list.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        columnColor={col.color}
                        advancing={advancingId === order.id}
                        onAdvance={() => advance(order)}
                      />
                    ))}

                    {!list.length ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-slate-400">
                        <Inbox className="h-8 w-8" />
                        <span>No orders</span>
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  columnColor,
  advancing,
  onAdvance,
}: {
  order: KitchenOrder;
  columnColor: string;
  advancing: boolean;
  onAdvance: () => void;
}) {
  const movable = (order.products || []).some((p) => p.next_status);
  const moveLabel = order.status?.id ? MOVE_LABELS[order.status.id] : null;
  const typeLabel = `${order.type?.name || 'Order'} #${order.order_number}`;
  const paid = order.payment_status?.id === 'paid';

  return (
    <article className="flex max-h-[min(70vh,560px)] shrink-0 flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-3.5 pb-1.5 pt-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <Monitor className="h-[18px] w-[18px] shrink-0 text-slate-500" />
            <span className="truncate text-[0.95rem] font-extrabold text-blue-600">{typeLabel}</span>
          </div>
          {order.table?.name ? (
            <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              {labelOf(order.table.name)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-1.5">
          <span className="text-xs font-semibold text-slate-500">{order.products_count ?? order.products.length} Items</span>
          {order.status_duration ? (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {order.status_duration} · {order.status?.name}
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-white ${
              paid ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          >
            {paid ? <Check className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
            {order.payment_status?.name || (paid ? 'Paid' : 'Unpaid')}
          </span>
        </div>

        <div className="px-3.5 pb-2.5 text-xs text-slate-400">
          Created {order.created_ago || 'just now'}
        </div>

        <div className="mx-3.5 h-px bg-slate-200" />

        <div className="px-3.5 py-2.5">
          {(order.products || []).map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 py-2 ${
                index < order.products.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <span className="w-4 shrink-0 pt-0.5 text-[11px] font-bold text-slate-400">{index + 1}</span>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <Salad className="h-5 w-5 text-[#5d3754]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="shrink-0 text-[13px] font-extrabold text-slate-800">{item.quantity}x</span>
                  <span className="truncate text-[13px] font-bold text-slate-800">{labelOf(item.name)}</span>
                </div>
                {item.special_instructions ? (
                  <p className="mt-0.5 text-[11px] italic text-slate-500">{item.special_instructions}</p>
                ) : null}
              </div>
              <div className="shrink-0 pt-0.5">
                {item.next_status ? (
                  <Circle className="h-5 w-5" style={{ color: item.status?.color || '#10B981' }} />
                ) : (
                  <CircleCheck className="h-5 w-5" style={{ color: item.status?.color || '#10B981' }} />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-3.5 pb-3 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {order.status?.name} at {order.time}
          </span>
          <span>{order.time}</span>
        </div>
      </div>

      {movable && moveLabel ? (
        <button
          type="button"
          disabled={advancing}
          onClick={onAdvance}
          className="flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2.5 text-sm font-extrabold text-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-75"
          style={{ background: columnColor }}
        >
          {advancing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ArrowRight className="h-[18px] w-[18px]" />
              <span>{moveLabel}</span>
              <ArrowRight className="h-[18px] w-[18px]" />
            </>
          )}
        </button>
      ) : (
        <div
          className="flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 text-sm font-extrabold text-white"
          style={{ background: columnColor }}
        >
          <CircleCheck className="h-[18px] w-[18px]" />
          <span>{order.status?.name || 'Served'}</span>
        </div>
      )}
    </article>
  );
}
