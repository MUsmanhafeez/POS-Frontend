'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  ClipboardList,
  RotateCcw,
  Save,
  ShoppingBag,
  Table2,
  Wallet,
  X,
  CloudUpload,
} from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/api';
import { posOfflineClient } from '@/lib/offline/posOfflineClient';
import { drainSyncQueue } from '@/lib/offline/syncEngine';
import ManagerPinModal from '@/components/admin/ManagerPinModal';
import SplitBillModal from '@/components/pos/SplitBillModal';
import { labelOf } from '@/lib/ui';

type Drawer = 'table-viewer' | 'orders' | 'sales-return' | 'cash-movement' | 'pending-sync' | null;

type TableRow = {
  id: string;
  name: unknown;
  status?: string;
  capacity?: number;
  floor?: unknown;
  zone?: unknown;
  floor_id?: string;
  zone_id?: string;
};
type OrderRow = {
  id: string;
  referenceNo?: string;
  reference_no?: string;
  status?: string;
  total?: number;
  type?: string;
  orderSource?: string;
  order_source?: string;
  externalPlatform?: string;
  external_platform?: string;
  externalId?: string;
  external_id?: string;
  createdAt?: string;
  created_at?: string;
  customer?: string;
};
type SalesReturnRow = OrderRow & { partyName?: string; remarks?: string; amount?: number };

const CASH_OUT_TYPES = ['Pay-Out', 'Tip-Out', 'Refund', 'Cash Drop', 'Correction'] as const;
const CASH_IN_TYPES = ['Pay-In', 'Tip-In', 'Float', 'Correction'] as const;

const TABLE_STATUS_CLASS: Record<string, string> = {
  available: 'border-emerald-300 bg-emerald-50',
  free: 'border-emerald-300 bg-emerald-50',
  occupied: 'border-orange-300 bg-orange-50',
  reserved: 'border-sky-300 bg-sky-50',
  dirty: 'border-rose-300 bg-rose-50',
};

export type PosModulesProps = {
  active: Drawer;
  onClose: () => void;
  sessionId: string | null;
  branchId?: string;
  currency?: string;
  onSelectTable?: (tableId: string, tableName: string) => void;
};

function DrawerShell({
  open,
  title,
  icon,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <>
      <button type="button" className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} aria-label="Close panel" />
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-[70] flex flex-col bg-white shadow-2xl',
          wide ? 'w-full max-w-3xl' : 'w-full max-w-md'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">{icon}</span>
            {title}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}

export function PosModules({ active, onClose, sessionId, branchId, currency = 'PKR', onSelectTable }: PosModulesProps) {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [floors, setFloors] = useState<Array<{ id: string; name: unknown }>>([]);
  const [zones, setZones] = useState<Array<{ id: string; name: unknown; floor_id?: string }>>([]);
  const [reservations, setReservations] = useState<Array<Record<string, unknown>>>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [heldOrders, setHeldOrders] = useState<OrderRow[]>([]);
  const [ordersTab, setOrdersTab] = useState<'active' | 'held'>('active');
  const [orderSourceFilter, setOrderSourceFilter] = useState<'all' | 'in_house' | 'aggregator'>('all');
  const [returnRows, setReturnRows] = useState<SalesReturnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'void' | 'refund' | 'cash';
    orderId?: string;
    amount?: number;
  } | null>(null);
  const [splitOrder, setSplitOrder] = useState<OrderRow | null>(null);
  const [pendingSync, setPendingSync] = useState<{
    queue: Array<{ id: string; type: string; status: string; createdAt?: string; lastError?: string }>;
    orders: Array<{ id: string; referenceNo: string; total: number; status: string }>;
  }>({ queue: [], orders: [] });
  const [cashApprover, setCashApprover] = useState<{ id: string; name: string } | null>(null);

  // Sales return filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState('all');
  const [serviceType, setServiceType] = useState('all');
  const [partyDesc, setPartyDesc] = useState('');

  // Cash movement
  const [cashDir, setCashDir] = useState<'in' | 'out'>('out');
  const [cashType, setCashType] = useState<string>('Cash Drop');
  const [cashAmount, setCashAmount] = useState('');
  const [cashRef, setCashRef] = useState('');
  const [cashNotes, setCashNotes] = useState('');
  const [cashMsg, setCashMsg] = useState('');

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    const tasks: Promise<void>[] = [];

    if (active === 'table-viewer') {
      tasks.push(
        api.get('/tables', { params: branchId ? { branch_id: branchId } : {} }).then((res) => {
          setTables(res.data.body || []);
        }),
        api.get('/floors', { params: branchId ? { branch_id: branchId } : {} }).then((res) => {
          setFloors(res.data.body || []);
        }),
        api.get('/zones', { params: branchId ? { branch_id: branchId } : {} }).then((res) => {
          setZones(res.data.body || []);
        }),
        api.get('/reservations').then((res) => {
          setReservations(res.data.body || []);
        })
      );
    }
    if (active === 'orders') {
      const sourceParam = orderSourceFilter === 'all' ? {} : { source: orderSourceFilter };
      tasks.push(
        api.get('/orders', { params: sourceParam }).then((res) => {
          setOrders((res.data.body || []) as OrderRow[]);
        }),
        api.get('/orders', { params: { held: 1, ...sourceParam } }).then((res) => {
          setHeldOrders((res.data.body || []) as OrderRow[]);
        })
      );
    }
    if (active === 'sales-return') {
      tasks.push(
        api.get('/orders').then((res) => {
          const rows = (res.data.body || []) as OrderRow[];
          setOrders(rows);
          if (active === 'sales-return') {
            setReturnRows(
              rows.filter((o) => {
                const created = String(o.createdAt || o.created_at || '').slice(0, 10);
                if (fromDate && created < fromDate) return false;
                if (toDate && created > toDate) return false;
                if (serviceType !== 'all' && o.type !== serviceType) return false;
                if (partyDesc && !String(o.customer || '').toLowerCase().includes(partyDesc.toLowerCase())) return false;
                return o.status !== 'voided';
              })
            );
          }
        })
      );
    }
    if (active === 'pending-sync') {
      tasks.push(
        posOfflineClient.listPendingSync().then((data) => {
          setPendingSync({
            queue: (data.queue || []).map((q) => ({
              id: q.id,
              type: q.type,
              status: q.status,
              createdAt: q.createdAt,
              lastError: q.lastError,
            })),
            orders: (data.orders || []).map((o) => ({
              id: o.id,
              referenceNo: o.referenceNo,
              total: o.total,
              status: o.status,
            })),
          });
        })
      );
    }

    Promise.all(tasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [active, branchId, fromDate, toDate, serviceType, partyDesc, orderSourceFilter]);

  async function submitCash(e: FormEvent) {
    e.preventDefault();
    if (!sessionId) {
      setCashMsg('Open a POS session first');
      return;
    }
    const amount = Number(cashAmount);
    if (!amount || amount <= 0) {
      setCashMsg('Enter a valid amount');
      return;
    }
    if (cashDir === 'out' && amount > 500 && !cashApprover) {
      setPendingAction({ type: 'cash' });
      setPinOpen(true);
      return;
    }
    await postCashMovement(amount);
  }

  async function postCashMovement(amount: number, approver?: { id: string; name: string }, pin?: string) {
    const type = `${cashDir === 'in' ? 'cash-in' : 'cash-out'}:${cashType.toLowerCase().replace(/\s+/g, '-')}`;
    await api.post(`/pos/sessions/${sessionId}/cash-movements`, {
      type,
      amount,
      reason: [cashRef, cashNotes].filter(Boolean).join(' · ') || cashType,
      approved_by: approver?.id,
      manager_pin: pin,
    });
    setCashMsg(`${cashType} recorded (${currency} ${amount.toFixed(currency === 'JOD' ? 3 : 2)})`);
    setCashAmount('');
    setCashRef('');
    setCashNotes('');
    setCashApprover(null);
  }

  async function recallHeld(orderId: string) {
    await api.post(`/orders/${orderId}/recall`);
    setCashMsg('Order recalled to cart');
    const [active, held] = await Promise.all([
      api.get('/orders'),
      api.get('/orders', { params: { held: 1 } }),
    ]);
    setOrders(active.data.body || []);
    setHeldOrders(held.data.body || []);
  }

  const filteredTables = tables.filter((t) => {
    if (floorFilter && t.floor_id !== floorFilter) return false;
    if (zoneFilter && t.zone_id !== zoneFilter) return false;
    return true;
  });

  function filterReturns() {
    setReturnRows(
      orders.filter((o) => {
        const created = String(o.createdAt || o.created_at || '').slice(0, 10);
        if (fromDate && created < fromDate) return false;
        if (toDate && created > toDate) return false;
        if (serviceType !== 'all' && o.type !== serviceType) return false;
        if (paymentType !== 'all' && o.status !== paymentType) return false;
        if (partyDesc && !String(o.customer || o.referenceNo || o.reference_no || '').toLowerCase().includes(partyDesc.toLowerCase()))
          return false;
        return o.status !== 'voided';
      })
    );
  }

  const cashTypes = cashDir === 'in' ? CASH_IN_TYPES : CASH_OUT_TYPES;

  return (
    <>
      <DrawerShell open={active === 'table-viewer'} title="Table Viewer" icon={<Table2 className="h-5 w-5" />} onClose={onClose}>
        {loading ? (
          <p className="text-sm text-slate-600">Loading tables…</p>
        ) : tables.length === 0 ? (
          <div className="grid place-items-center py-12 text-center">
            <AlertCircle className="mb-3 h-12 w-12 text-amber-500" />
            <h3 className="font-bold text-slate-900">Your Table Area is Empty</h3>
            <p className="mt-2 max-w-xs text-sm text-slate-600">
              You don&apos;t have any tables created yet. Start by adding tables so you can manage seating and dine-in service.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
                <option value="">All floors</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>{labelOf(f.name)}</option>
                ))}
              </select>
              <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                <option value="">All zones</option>
                {zones.filter((z) => !floorFilter || z.floor_id === floorFilter).map((z) => (
                  <option key={z.id} value={z.id}>{labelOf(z.name)}</option>
                ))}
              </select>
            </div>
            {reservations.length > 0 && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs">
                <div className="font-bold text-sky-900">Upcoming reservations</div>
                <ul className="mt-2 space-y-1 text-sky-800">
                  {reservations.slice(0, 5).map((r, i) => (
                    <li key={i}>{String(r.customer_name || 'Guest')} · {String(r.reserved_at || '').slice(0, 16)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredTables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelectTable?.(t.id, labelOf(t.name));
                  onClose();
                }}
                className={clsx(
                  'rounded-xl border p-3 text-left transition hover:shadow-sm',
                  TABLE_STATUS_CLASS[String(t.status || 'available')] || 'border-teal-200 bg-teal-50'
                )}
              >
                <div className="font-bold text-slate-900">{labelOf(t.name)}</div>
                <div className="mt-1 text-xs capitalize text-slate-600">{t.status || 'available'}</div>
                <div className="text-xs text-slate-500">Seats {t.capacity ?? 4}</div>
              </button>
            ))}
            </div>
          </div>
        )}
      </DrawerShell>

      <DrawerShell open={active === 'orders'} title="Order Management" icon={<ClipboardList className="h-5 w-5" />} onClose={onClose} wide>
        <div className="mb-3 flex flex-wrap gap-2">
          {(['all', 'in_house', 'aggregator'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-bold',
                orderSourceFilter === f ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600'
              )}
              onClick={() => setOrderSourceFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'in_house' ? 'In-house' : 'Aggregator'}
            </button>
          ))}
        </div>
        <div className="mb-4 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            className={clsx('px-3 py-2 text-sm font-bold', ordersTab === 'active' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500')}
            onClick={() => setOrdersTab('active')}
          >
            Active Orders
          </button>
          <button
            type="button"
            className={clsx('px-3 py-2 text-sm font-bold', ordersTab === 'held' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500')}
            onClick={() => setOrdersTab('held')}
          >
            Held ({heldOrders.length})
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-600">Loading orders…</p>
        ) : ordersTab === 'held' ? (
          heldOrders.length === 0 ? (
            <p className="text-sm text-slate-600">No held orders.</p>
          ) : (
            <ul className="space-y-2">
              {heldOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <div>
                    <div className="font-bold">{o.referenceNo || o.reference_no || o.id.slice(0, 8)}</div>
                    <div className="text-xs capitalize text-slate-500">held</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-800">{currency} {Number(o.total || 0).toFixed(2)}</span>
                    <button type="button" className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-bold text-white" onClick={() => recallHeld(o.id)}>
                      Recall
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : orders.filter((o) => !['completed', 'cancelled', 'voided'].includes(String(o.status))).length === 0 ? (
          <div className="grid place-items-center py-12 text-center">
            <ClipboardList className="mb-3 h-12 w-12 text-teal-400" />
            <h3 className="font-bold text-slate-900">No Active Orders</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              There are no active orders at the moment. New orders will appear here once created or updated.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {orders
              .filter((o) => !['completed', 'cancelled', 'voided'].includes(String(o.status)))
              .map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <div>
                    <div className="font-bold">{o.referenceNo || o.reference_no || o.id.slice(0, 8)}</div>
                    <div className="text-xs capitalize text-slate-500">
                      {o.type} · {o.status}
                      {(o.orderSource || o.order_source || o.externalPlatform || o.external_platform) ? (
                        <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                          {o.externalPlatform || o.external_platform || o.orderSource || o.order_source}
                          {o.externalId || o.external_id ? ` #${o.externalId || o.external_id}` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-teal-800">
                      {currency} {Number(o.total || 0).toFixed(currency === 'JOD' ? 3 : 2)}
                    </div>
                    <button type="button" className="text-xs font-bold text-violet-700" onClick={() => setSplitOrder(o)}>
                      Split
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </DrawerShell>

      <DrawerShell open={active === 'sales-return'} title="Sales Return" icon={<RotateCcw className="h-5 w-5" />} onClose={onClose} wide>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold text-slate-700">
            From Date
            <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-700">
            To Date
            <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Payment Type
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">
            Service Type
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="all">All</option>
              <option value="takeaway">Takeaway</option>
              <option value="dine_in">Dine-In</option>
              <option value="home_delivery">Home Delivery</option>
              <option value="pick_up">Pick-up</option>
              <option value="drive_thru">Drive-Thru</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700 sm:col-span-2">
            Party Description
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={partyDesc} onChange={(e) => setPartyDesc(e.target.value)} placeholder="Search customer or reference" />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button type="button" onClick={filterReturns} className="h-10 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white hover:bg-teal-700">
              Apply filters
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">V.No</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returnRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium">{r.referenceNo || r.reference_no || '—'}</td>
                  <td className="px-3 py-2">{String(r.createdAt || r.created_at || '').slice(0, 10)}</td>
                  <td className="px-3 py-2">{r.customer || 'Walk-in'}</td>
                  <td className="px-3 py-2">{Number(r.total || 0).toFixed(currency === 'JOD' ? 3 : 2)}</td>
                  <td className="px-3 py-2 capitalize">{r.type || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                        onClick={() => {
                          setPendingAction({ type: 'void', orderId: r.id });
                          setPinOpen(true);
                        }}
                      >
                        Void
                      </button>
                      <button
                        type="button"
                        className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"
                        onClick={() => {
                          setPendingAction({ type: 'refund', orderId: r.id, amount: Number(r.total || 0) });
                          setPinOpen(true);
                        }}
                      >
                        Refund
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!returnRows.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    No records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>{returnRows.length} Records</span>
        </div>
      </DrawerShell>

      <DrawerShell open={active === 'cash-movement'} title="Cash Flow Management" icon={<Wallet className="h-5 w-5" />} onClose={onClose}>
        <form onSubmit={submitCash} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['in', 'out'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => {
                  setCashDir(dir);
                  setCashType(dir === 'in' ? CASH_IN_TYPES[0] : CASH_OUT_TYPES[3]);
                }}
                className={clsx(
                  'rounded-xl border px-3 py-2.5 text-sm font-bold capitalize',
                  cashDir === dir ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'
                )}
              >
                {dir}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cashTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCashType(t)}
                className={clsx(
                  'rounded-xl border px-2 py-2 text-xs font-bold',
                  cashType === t ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200 text-slate-600'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="block text-xs font-bold text-slate-700">
            {currency} Amount
            <input
              required
              type="number"
              step="0.001"
              min="0"
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Reference
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={cashRef} onChange={(e) => setCashRef(e.target.value)} />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Notes
            <textarea className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows={3} value={cashNotes} onChange={(e) => setCashNotes(e.target.value)} />
          </label>
          {cashMsg ? <p className="text-sm font-semibold text-teal-700">{cashMsg}</p> : null}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-700">
              Cancel
            </button>
            <button type="submit" className="btn-solid flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold !text-white hover:bg-teal-700">
              <Save className="h-4 w-4" /> Submit
            </button>
          </div>
        </form>
      </DrawerShell>

      <DrawerShell open={active === 'pending-sync'} title="Pending sync" icon={<CloudUpload className="h-5 w-5" />} onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Offline sales and actions waiting to upload to the server.</p>
          <button
            type="button"
            className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-bold text-white"
            onClick={() =>
              drainSyncQueue(true).then(() =>
                posOfflineClient.listPendingSync().then((data) =>
                  setPendingSync({
                    queue: (data.queue || []).map((q) => ({
                      id: q.id,
                      type: q.type,
                      status: q.status,
                      createdAt: q.createdAt,
                      lastError: q.lastError,
                    })),
                    orders: (data.orders || []).map((o) => ({
                      id: o.id,
                      referenceNo: o.referenceNo,
                      total: o.total,
                      status: o.status,
                    })),
                  })
                )
              )
            }
          >
            Sync now
          </button>
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500">Queued orders</h4>
            <ul className="mt-2 space-y-2">
              {pendingSync.orders.map((o) => (
                <li key={o.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-semibold">{o.referenceNo}</span>
                  <span className="text-slate-500"> · {o.total.toFixed(2)} {currency}</span>
                </li>
              ))}
              {!pendingSync.orders.length ? <li className="text-sm text-slate-500">No pending orders</li> : null}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500">Outbox events</h4>
            <ul className="mt-2 space-y-2">
              {pendingSync.queue.map((q) => (
                <li key={q.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <div className="font-semibold">{q.type}</div>
                  <div className="text-xs text-slate-500">{q.status}{q.lastError ? ` · ${q.lastError}` : ''}</div>
                </li>
              ))}
              {!pendingSync.queue.length ? <li className="text-sm text-slate-500">Queue empty</li> : null}
            </ul>
          </div>
        </div>
      </DrawerShell>

      <ManagerPinModal
        open={pinOpen}
        onClose={() => {
          setPinOpen(false);
          setPendingAction(null);
        }}
        onVerified={async (approver, pin) => {
          if (!pendingAction) return;
          if (pendingAction.type === 'void' && pendingAction.orderId) {
            await api.post(`/orders/${pendingAction.orderId}/void`, { reason: 'POS void', approved_by: approver.id, manager_pin: pin });
            const res = await api.get('/orders');
            const rows = (res.data.body || []) as OrderRow[];
            setOrders(rows);
            setReturnRows(
              rows.filter((o) => {
                const created = String(o.createdAt || o.created_at || '').slice(0, 10);
                if (fromDate && created < fromDate) return false;
                if (toDate && created > toDate) return false;
                if (serviceType !== 'all' && o.type !== serviceType) return false;
                if (partyDesc && !String(o.customer || o.referenceNo || o.reference_no || '').toLowerCase().includes(partyDesc.toLowerCase()))
                  return false;
                return o.status !== 'voided';
              })
            );
          } else if (pendingAction.type === 'refund' && pendingAction.orderId) {
            await api.post(`/orders/${pendingAction.orderId}/refund`, {
              reason: 'POS refund',
              amount: pendingAction.amount || 0,
              approved_by: approver.id,
              manager_pin: pin,
            });
            const res = await api.get('/orders');
            const rows = (res.data.body || []) as OrderRow[];
            setOrders(rows);
            setReturnRows(
              rows.filter((o) => {
                const created = String(o.createdAt || o.created_at || '').slice(0, 10);
                if (fromDate && created < fromDate) return false;
                if (toDate && created > toDate) return false;
                if (serviceType !== 'all' && o.type !== serviceType) return false;
                if (partyDesc && !String(o.customer || o.referenceNo || o.reference_no || '').toLowerCase().includes(partyDesc.toLowerCase()))
                  return false;
                return o.status !== 'voided';
              })
            );
          } else if (pendingAction.type === 'cash') {
            const amount = Number(cashAmount);
            await postCashMovement(amount, approver, pin);
          }
          setPendingAction(null);
        }}
      />
      {splitOrder && (
        <SplitBillModal
          open
          orderId={splitOrder.id}
          orderRef={splitOrder.referenceNo || splitOrder.reference_no}
          total={Number(splitOrder.total || 0)}
          currency={currency}
          onClose={() => setSplitOrder(null)}
          onDone={() => {
            api.get('/orders').then((res) => setOrders(res.data.body || []));
            setSplitOrder(null);
          }}
        />
      )}
    </>
  );
}

export type PosModuleId = 'table-viewer' | 'orders' | 'sales-return' | 'cash-movement' | 'pending-sync';

export const POS_MODULE_ITEMS: Array<{ id: PosModuleId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'table-viewer', label: 'Table Viewer', icon: Table2 },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'sales-return', label: 'Sales Return', icon: RotateCcw },
  { id: 'cash-movement', label: 'Cash Movement', icon: Banknote },
  { id: 'pending-sync', label: 'Pending sync', icon: CloudUpload },
];

export function PosHomeDeliveryModal({
  open,
  onClose,
  onConfirm,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: Record<string, string>) => void;
  initial?: Record<string, string>;
}) {
  const [form, setForm] = useState({
    calling_no: '',
    name: '',
    category: 'House',
    no: '',
    floor: '',
    street: '',
    block: '',
    area: '',
    near_by: '',
    city: '',
    flag: 'Default',
    address: '',
    ...initial,
  });

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, ...initial }));
  }, [open, initial]);

  if (!open) return null;

  function set(k: string, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[80] bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="fixed left-1/2 top-1/2 z-[90] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Home Delivery</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {[
            ['Calling No', 'calling_no'],
            ['Name', 'name'],
            ['Category', 'category', 'select', ['House', 'Office', 'Other']],
            ['No #', 'no'],
            ['Floor', 'floor'],
            ['Street #', 'street'],
            ['Block', 'block'],
            ['Area', 'area'],
            ['Near By', 'near_by'],
            ['City', 'city'],
            ['Flag', 'flag', 'select', ['Default', 'VIP']],
          ].map((row) => {
            const label = row[0] as string;
            const key = row[1] as string;
            const kind = row[2] as string | undefined;
            const opts = row[3] as string[] | undefined;
            return (
            <label key={key} className="text-xs font-bold text-slate-700">
              {label}
              {kind === 'select' ? (
                <select className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)}>
                  {(opts || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} />
              )}
            </label>
            );
          })}
          <label className="text-xs font-bold text-slate-700 sm:col-span-2">
            Address
            <textarea className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(form);
              onClose();
            }}
            className="btn-solid rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold !text-white hover:bg-teal-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

export function PosOrderTypeFields({
  orderTypeId,
  meta,
  onChange,
  onOpenDelivery,
}: {
  orderTypeId: string;
  meta: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
  onOpenDelivery?: () => void;
}) {
  const fieldClass = 'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-teal-500';

  if (orderTypeId === 'home_delivery') {
    return (
      <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <div className="flex items-center justify-between text-sm font-bold text-sky-900">
          <span>Delivery address</span>
          <button type="button" onClick={onOpenDelivery} className="text-xs font-bold text-teal-700 hover:underline">
            + Add / Edit
          </button>
        </div>
        <p className="text-xs text-slate-600">{meta.address || meta.name || 'No delivery details yet'}</p>
      </div>
    );
  }

  if (orderTypeId === 'drive_thru') {
    return (
      <div className="grid gap-2">
        <label className="text-xs font-bold text-slate-700">
          Car Plate
          <input className={fieldClass} value={meta.car_plate || ''} onChange={(e) => onChange({ car_plate: e.target.value })} />
        </label>
        <label className="text-xs font-bold text-slate-700">
          Car Description
          <input className={fieldClass} value={meta.car_desc || ''} onChange={(e) => onChange({ car_desc: e.target.value })} />
        </label>
      </div>
    );
  }

  if (orderTypeId === 'pre_order') {
    return (
      <label className="text-xs font-bold text-slate-700">
        Scheduled At
        <input type="datetime-local" className={fieldClass} value={meta.scheduled_at || ''} onChange={(e) => onChange({ scheduled_at: e.target.value })} />
      </label>
    );
  }

  if (orderTypeId === 'food_panda') {
    return (
      <label className="text-xs font-bold text-slate-700">
        Food Panda Order No
        <input className={fieldClass} value={meta.external_order_no || ''} onChange={(e) => onChange({ external_order_no: e.target.value })} placeholder="Aggregator order ID" />
      </label>
    );
  }

  if (orderTypeId === 'golootlo') {
    return (
      <label className="text-xs font-bold text-slate-700">
        Golootlo Order No
        <input className={fieldClass} value={meta.external_order_no || ''} onChange={(e) => onChange({ external_order_no: e.target.value })} placeholder="Aggregator order ID" />
      </label>
    );
  }

  if (orderTypeId === 'dine_in' && meta.table_name) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
        Table: {meta.table_name}
      </div>
    );
  }

  return null;
}
