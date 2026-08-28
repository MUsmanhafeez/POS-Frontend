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
} from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/api';
import { labelOf } from '@/lib/ui';

type Drawer = 'table-viewer' | 'orders' | 'sales-return' | 'cash-movement' | null;

type TableRow = { id: string; name: unknown; status?: string; capacity?: number; floor?: unknown; zone?: unknown };
type OrderRow = {
  id: string;
  referenceNo?: string;
  reference_no?: string;
  status?: string;
  total?: number;
  type?: string;
  createdAt?: string;
  created_at?: string;
  customer?: string;
};
type SalesReturnRow = OrderRow & { partyName?: string; remarks?: string; amount?: number };

const CASH_OUT_TYPES = ['Pay-Out', 'Tip-Out', 'Refund', 'Cash Drop', 'Correction'] as const;
const CASH_IN_TYPES = ['Pay-In', 'Tip-In', 'Float', 'Correction'] as const;

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
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [returnRows, setReturnRows] = useState<SalesReturnRow[]>([]);
  const [loading, setLoading] = useState(false);

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
        })
      );
    }
    if (active === 'orders' || active === 'sales-return') {
      tasks.push(
        api.get('/orders', { params: { status: active === 'orders' ? undefined : undefined } }).then((res) => {
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

    Promise.all(tasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [active, branchId, fromDate, toDate, serviceType, partyDesc]);

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
    const type = `${cashDir === 'in' ? 'cash-in' : 'cash-out'}:${cashType.toLowerCase().replace(/\s+/g, '-')}`;
    await api.post(`/pos/sessions/${sessionId}/cash-movements`, {
      type,
      amount,
      reason: [cashRef, cashNotes].filter(Boolean).join(' · ') || cashType,
    });
    setCashMsg(`${cashType} recorded (${currency} ${amount.toFixed(currency === 'JOD' ? 3 : 2)})`);
    setCashAmount('');
    setCashRef('');
    setCashNotes('');
  }

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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelectTable?.(t.id, labelOf(t.name));
                  onClose();
                }}
                className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-left transition hover:border-teal-400 hover:bg-teal-100"
              >
                <div className="font-bold text-slate-900">{labelOf(t.name)}</div>
                <div className="mt-1 text-xs capitalize text-slate-600">{t.status || 'available'}</div>
                <div className="text-xs text-slate-500">Seats {t.capacity ?? 4}</div>
              </button>
            ))}
          </div>
        )}
      </DrawerShell>

      <DrawerShell open={active === 'orders'} title="Order Management" icon={<ClipboardList className="h-5 w-5" />} onClose={onClose} wide>
        <div className="mb-4 flex gap-2 border-b border-slate-200">
          <button type="button" className="border-b-2 border-teal-600 px-3 py-2 text-sm font-bold text-teal-800">
            Active Orders
          </button>
          <button type="button" className="px-3 py-2 text-sm font-medium text-slate-500">
            Upcoming Orders
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-600">Loading orders…</p>
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
                    </div>
                  </div>
                  <div className="font-bold text-teal-800">
                    {currency} {Number(o.total || 0).toFixed(currency === 'JOD' ? 3 : 2)}
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
                </tr>
              ))}
              {!returnRows.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
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
    </>
  );
}

export type PosModuleId = 'table-viewer' | 'orders' | 'sales-return' | 'cash-movement';

export const POS_MODULE_ITEMS: Array<{ id: PosModuleId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'table-viewer', label: 'Table Viewer', icon: Table2 },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'sales-return', label: 'Sales Return', icon: RotateCcw },
  { id: 'cash-movement', label: 'Cash Movement', icon: Banknote },
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
