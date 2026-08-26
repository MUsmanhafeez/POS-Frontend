'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Bike,
  CalendarDays,
  Car,
  ChevronDown,
  Flame,
  Globe2,
  LayoutGrid,
  Maximize,
  Menu,
  Minus,
  Monitor,
  Moon,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sun,
  Table2,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
  ChefHat,
} from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { labelOf } from '@/lib/ui';

type CartItem = {
  productId: string;
  name: unknown;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  accent: string;
};

const ORDER_TYPES: OrderType[] = [
  { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag, value: 'takeaway', accent: 'from-orange-500 to-amber-500' },
  { id: 'dine_in', label: 'Dine-In', icon: UtensilsCrossed, value: 'dine_in', accent: 'from-teal-500 to-emerald-500' },
  { id: 'home_delivery', label: 'Home Delivery', icon: Bike, value: 'home_delivery', accent: 'from-sky-500 to-blue-600' },
  { id: 'pick_up', label: 'Pick-up', icon: Package, value: 'pick_up', accent: 'from-violet-500 to-fuchsia-500' },
  { id: 'drive_thru', label: 'Drive-Thru', icon: Car, value: 'drive_thru', accent: 'from-rose-500 to-pink-500' },
  { id: 'pre_order', label: 'Pre-Order', icon: CalendarDays, value: 'dine_in', accent: 'from-cyan-500 to-teal-600' },
  { id: 'food_panda', label: 'Food Panda', icon: ChefHat, value: 'home_delivery', accent: 'from-pink-500 to-rose-600' },
  { id: 'golootlo', label: 'Golootlo', icon: Globe2, value: 'takeaway', accent: 'from-lime-500 to-green-600' },
];

const PRODUCT_TONES = [
  'from-teal-50 to-emerald-100 border-teal-200',
  'from-orange-50 to-amber-100 border-orange-200',
  'from-sky-50 to-blue-100 border-sky-200',
  'from-fuchsia-50 to-pink-100 border-fuchsia-200',
  'from-violet-50 to-purple-100 border-violet-200',
  'from-lime-50 to-green-100 border-lime-200',
];

const CAT_TONES = [
  'bg-teal-600 text-white',
  'bg-orange-500 text-white',
  'bg-sky-600 text-white',
  'bg-fuchsia-600 text-white',
  'bg-violet-600 text-white',
];

const MODULES = [
  { href: '/admin/seating', label: 'Table Viewer', icon: Table2 },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Sales Return', icon: RotateCcw },
  { href: '/admin/shift-sessions', label: 'Cash Movement', icon: Wallet },
];

const VAT_RATE = 0.15;

function money(n: number, currency = 'PKR') {
  const decimals = currency === 'JOD' ? 3 : 2;
  return `${currency} ${Number(n || 0).toFixed(decimals)}`;
}

function mapCartItems(raw: Array<Record<string, unknown>> = []): CartItem[] {
  return raw.map((i) => ({
    productId: String(i.productId),
    name: i.name,
    qty: Number(i.qty),
    unitPrice: Number(i.unitPrice),
    lineTotal: Number(i.lineTotal),
  }));
}

export default function PosViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const registerId = params.id;

  const [boot, setBoot] = useState<Record<string, unknown> | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cartUuid, setCartUuid] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState('');
  const [menuId, setMenuId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [orderTypeId, setOrderTypeId] = useState('takeaway');
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const register = boot?.register as Record<string, unknown> | undefined;
  const products = (boot?.products as Array<Record<string, unknown>>) || [];
  const categories = (boot?.categories as Array<Record<string, unknown>>) || [];
  const menus = (boot?.menus as Array<Record<string, unknown>>) || [];
  const currency = 'PKR';

  const filteredCategories = useMemo(() => {
    if (menuId === 'all') return categories;
    return categories.filter((c) => String(c.menuId) === menuId);
  }, [categories, menuId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (menuId !== 'all' && String(p.menuId) !== menuId) return false;
      if (categoryId === 'all') return true;
      return ((p.categoryIds as string[]) || []).includes(categoryId);
    });
  }, [products, menuId, categoryId]);

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
  const orderType = ORDER_TYPES.find((t) => t.id === orderTypeId) || ORDER_TYPES[0];

  async function load() {
    const { data } = await api.get(`/pos/viewer/${registerId}`);
    setBoot(data.body);
    setSessionId(data.body.session?.id || null);
    if (data.body.menus?.[0]?.id && menuId === 'all') {
      // keep "all" as default so products show
    }
  }

  useEffect(() => {
    load().catch(console.error);
    setDark(localStorage.getItem('forkiva-theme') === 'dark');
  }, [registerId]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(''), 3200);
    return () => window.clearTimeout(t);
  }, [message]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('forkiva-theme', next ? 'dark' : 'light');
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }

  async function openSession() {
    setBusy(true);
    try {
      const { data } = await api.post('/pos/sessions/open', {
        pos_register_id: registerId,
        opening_float: 0,
      });
      setSessionId(data.body.id);
      setMessage('Session opened');
      await load();
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not open session');
    } finally {
      setBusy(false);
    }
  }

  async function ensureCart() {
    if (cartUuid) return cartUuid;
    const { data } = await api.post('/cart', {
      branch_id: register?.branchId,
      pos_register_id: registerId,
      pos_session_id: sessionId,
      order_type: orderType.value,
      guest_count: guestCount,
    });
    setCartUuid(data.body.uuid);
    return data.body.uuid as string;
  }

  async function syncCartMeta(uuid: string, patch: Record<string, unknown>) {
    await api.patch(`/cart/${uuid}`, patch);
  }

  async function addProduct(p: Record<string, unknown>) {
    if (!sessionId) {
      setMessage('Open a POS session first');
      return;
    }
    setBusy(true);
    try {
      const uuid = await ensureCart();
      const price = Number(p.specialPrice ?? p.price ?? 0);
      const { data } = await api.post(`/cart/${uuid}/items`, {
        product_id: p.id,
        qty: 1,
        unit_price: price,
      });
      setItems(mapCartItems(data.body.items || []));
      setOrderPanelOpen(true);
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not add item');
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(index: number) {
    if (!cartUuid) return;
    const { data } = await api.delete(`/cart/${cartUuid}/items/${index}`);
    setItems(mapCartItems(data.body.items || []));
  }

  async function clearOrder() {
    setCartUuid(null);
    setItems([]);
    setNotes('');
    setGuestCount(1);
    setMessage('Order cleared');
  }

  async function changeOrderType(id: string) {
    setOrderTypeId(id);
    const next = ORDER_TYPES.find((t) => t.id === id);
    if (cartUuid && next) {
      await syncCartMeta(cartUuid, { order_type: next.value }).catch(() => undefined);
    }
    setSidebarOpen(false);
  }

  async function changeGuests(next: number) {
    const value = Math.max(1, next);
    setGuestCount(value);
    if (cartUuid) await syncCartMeta(cartUuid, { guest_count: value }).catch(() => undefined);
  }

  async function checkout(mode: 'pay' | 'kitchen' | 'hold') {
    if (mode === 'hold') {
      setMessage('Order held on this register');
      return;
    }
    if (!items.length) {
      setMessage('Add items before continuing');
      return;
    }
    if (!sessionId) {
      setMessage('Open a POS session first');
      return;
    }
    setBusy(true);
    try {
      const uuid = await ensureCart();
      if (notes) await syncCartMeta(uuid, { notes });
      const { data } = await api.post(`/cart/${uuid}/checkout`, {
        mark_paid: mode === 'pay',
        payment_method: 'cash',
      });
      setMessage(mode === 'pay' ? `Paid ${data.body.referenceNo}` : `Sent to kitchen ${data.body.referenceNo}`);
      setCartUuid(null);
      setItems([]);
      setNotes('');
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  if (!boot) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-teal-50 via-white to-orange-50 text-slate-700">
        <div className="rounded-2xl border border-teal-200 bg-white px-6 py-4 font-semibold text-teal-800 shadow-sm">
          Loading POS…
        </div>
      </div>
    );
  }

  const initial = (user?.name || 'F').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-teal-50 via-[#f4f7f6] to-orange-50 text-slate-900">
      {/* Mobile overlays */}
      {sidebarOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />
      )}
      {orderPanelOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={() => setOrderPanelOpen(false)} aria-label="Close order panel" />
      )}

      {/* Left order-type sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[7.75rem] flex-col bg-gradient-to-b from-teal-800 via-teal-900 to-slate-900 text-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-3 py-3 lg:hidden">
          <span className="text-xs font-bold tracking-wide">POS</span>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {ORDER_TYPES.map((type) => {
            const Icon = type.icon;
            const active = orderTypeId === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => changeOrderType(type.id)}
                className={clsx(
                  'flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center transition',
                  active ? `bg-gradient-to-br ${type.accent} shadow-lg` : 'hover:bg-white/10'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold leading-tight">{type.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/20 px-2 py-2">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.label}
                href={mod.href}
                className="mb-1 flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-teal-50 transition hover:bg-white/10"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold leading-tight">{mod.label}</span>
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="mt-1 flex w-full flex-col items-center gap-1 rounded-xl bg-orange-500/20 px-2 py-2.5 text-center text-orange-100 transition hover:bg-orange-500/30"
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[11px] font-semibold">Admin</span>
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-4">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <SelectPill icon={<UtensilsCrossed className="h-3.5 w-3.5" />} label="Forkiva" />
            <select
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none"
              value={menuId}
              onChange={(e) => {
                setMenuId(e.target.value);
                setCategoryId('all');
              }}
            >
              <option value="all">All Menus</option>
              {menus.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {labelOf(m.name) || 'Menu'}
                </option>
              ))}
            </select>
            <SelectPill
              icon={<Monitor className="h-3.5 w-3.5" />}
              label={`${labelOf(register?.name) || 'Register'} (${String(register?.code || '—')})`}
            />
            {sessionId ? (
              <span className="btn-solid inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-500 px-3 text-sm font-bold !text-white shadow-sm">
                Session open
              </span>
            ) : (
              <button
                type="button"
                onClick={openSession}
                disabled={busy}
                className="btn-solid inline-flex h-9 items-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-sm font-bold !text-white shadow-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-60"
              >
                Open session
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/admin/kitchen')}
              className="rounded-lg bg-sky-50 p-2 text-sky-700 hover:bg-sky-100"
              title="Kitchen display"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="rounded-lg bg-orange-50 p-2 text-orange-700 hover:bg-orange-100 xl:hidden"
              onClick={() => setOrderPanelOpen(true)}
              title="Current order"
            >
              <ShoppingBag className="h-4 w-4" />
              {items.length > 0 && (
                <span className="ml-0.5 rounded-full bg-orange-600 px-1.5 text-[10px] font-bold text-white">{items.length}</span>
              )}
            </button>
            <button type="button" className="rounded-lg p-2 text-slate-700 hover:bg-teal-50 hover:text-teal-800" onClick={toggleFullscreen}>
              <Maximize className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-2 text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={toggleTheme}>
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button type="button" className="hidden items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800 sm:inline-flex">
              <Globe2 className="h-4 w-4" /> EN
            </button>
            <button
              type="button"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 text-xs font-bold text-white shadow-sm"
              title={user?.name}
              onClick={async () => {
                if (confirm('Logout from POS?')) {
                  await logout();
                  router.push('/auth/login');
                }
              }}
            >
              {initial}
            </button>
          </div>
        </header>

        {message && (
          <div className="border-b border-teal-200 bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-900">{message}</div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* Product area */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex gap-2 overflow-x-auto border-b border-teal-100 bg-white/90 px-3 py-2 backdrop-blur">
              <CatChip active={categoryId === 'all'} onClick={() => setCategoryId('all')} tone="bg-teal-700 text-white">
                All
              </CatChip>
              {filteredCategories.map((c, i) => (
                <CatChip
                  key={String(c.id)}
                  active={categoryId === String(c.id)}
                  onClick={() => setCategoryId(String(c.id))}
                  tone={CAT_TONES[i % CAT_TONES.length]}
                >
                  {labelOf(c.name)}
                </CatChip>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {filtered.length === 0 ? (
                <div className="grid h-full min-h-[20rem] place-items-center rounded-2xl border border-dashed border-teal-300 bg-white/80 px-6 text-center shadow-sm">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-orange-100 text-teal-700">
                      <ChefHat className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">No Products in This Menu</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-700">
                      This menu does not contain any products. Please choose another menu to continue, or add products in Admin → Products.
                    </p>
                    <Link
                      href="/admin/products"
                      className="btn-solid mt-4 inline-flex rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-bold !text-white shadow-sm hover:from-teal-700 hover:to-emerald-700"
                    >
                      Manage products
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filtered.map((p, i) => (
                    <button
                      key={String(p.id)}
                      type="button"
                      disabled={busy}
                      onClick={() => addProduct(p)}
                      className={clsx(
                        'rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60',
                        PRODUCT_TONES[i % PRODUCT_TONES.length]
                      )}
                    >
                      <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-white/70 text-slate-500">
                        <UtensilsCrossed className="h-8 w-8" />
                      </div>
                      <div className="line-clamp-2 text-sm font-bold text-slate-900">{labelOf(p.name)}</div>
                      <div className="mt-2 text-base font-extrabold text-teal-800">
                        {money(Number(p.specialPrice ?? p.price ?? 0), currency)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right current order panel */}
          <aside
            className={clsx(
              'fixed inset-y-0 right-0 z-50 flex w-full max-w-[22rem] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform xl:static xl:z-auto xl:max-w-none xl:w-[22rem] xl:shadow-none',
              orderPanelOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
            )}
          >
            <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">Current Order</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={clearOrder} className="text-sm font-bold text-rose-600 hover:text-rose-700">
                  Clear All
                </button>
                <button type="button" className="rounded-lg p-1 text-slate-600 xl:hidden" onClick={() => setOrderPanelOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Users className="h-4 w-4 text-teal-600" /> Guest count
                </span>
                <div className="inline-flex items-center rounded-xl border border-teal-200 bg-teal-50">
                  <button type="button" className="px-2.5 py-1.5 text-teal-800 hover:bg-teal-100" onClick={() => changeGuests(guestCount - 1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-extrabold text-slate-900">{guestCount}</span>
                  <button type="button" className="px-2.5 py-1.5 text-teal-800 hover:bg-teal-100" onClick={() => changeGuests(guestCount + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="relative block">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
                  <select className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-teal-500">
                    <option>Select Waiter</option>
                    <option>{user?.name || 'Cashier'}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </label>
                <div className="flex gap-2">
                  <label className="relative block flex-1">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" />
                    <select className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-sky-500">
                      <option>Select Customer</option>
                      <option>Walk-in</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </label>
                  <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((v) => !v)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-rose-300 bg-rose-50 px-3 text-sm font-bold text-rose-700 hover:bg-rose-100"
                >
                  Actions
                  <ChevronDown className="h-4 w-4" />
                </button>
                {actionsOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setActionsOpen(false); clearOrder(); }}>
                      Clear order
                    </button>
                    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setActionsOpen(false); checkout('hold'); }}>
                      Hold order
                    </button>
                    <Link href="/admin/orders" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => setActionsOpen(false)}>
                      View orders
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <div className="grid h-full min-h-[12rem] place-items-center text-center">
                  <div>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No Items in the Order</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                      Select dishes from the menu to start your order.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li key={`${item.productId}-${index}`} className="rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900">{labelOf(item.name)}</div>
                          <div className="mt-0.5 text-xs font-medium text-slate-600">
                            {item.qty} × {money(item.unitPrice, currency)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-teal-800">{money(item.lineTotal, currency)}</div>
                          <button type="button" className="mt-1 text-xs font-bold text-rose-600" onClick={() => removeItem(index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3">
              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Notes</span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => {
                    if (cartUuid) syncCartMeta(cartUuid, { notes }).catch(() => undefined);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-teal-500"
                  placeholder="Order notes"
                />
              </label>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <button type="button" className="h-10 rounded-xl border border-amber-300 bg-amber-50 text-sm font-bold text-amber-800 hover:bg-amber-100">
                  Discount
                </button>
                <button type="button" className="h-10 rounded-xl border border-violet-300 bg-violet-50 text-sm font-bold text-violet-800 hover:bg-violet-100">
                  Voucher
                </button>
              </div>

              <div className="mb-3 space-y-1.5 rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{money(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>VAT 15%</span>
                  <span className="font-bold text-slate-900">{money(vat, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
                  <span>Total</span>
                  <span className="text-orange-700">{money(total, currency)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={busy || !items.length}
                onClick={() => checkout('pay')}
                className="btn-solid mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-sm font-extrabold !text-white shadow-md hover:from-orange-600 hover:to-rose-600 disabled:opacity-45"
              >
                <Flame className="h-4 w-4" />
                Pay & Fire
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy || !items.length}
                  onClick={() => checkout('kitchen')}
                  className="btn-solid h-11 rounded-xl bg-teal-600 text-sm font-bold !text-white hover:bg-teal-700 disabled:opacity-45"
                >
                  Send to Kitchen
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => checkout('hold')}
                  className="h-11 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-45"
                >
                  Hold Order
                </button>
              </div>
              <div className="mt-2 text-center text-[11px] font-bold uppercase tracking-wide text-teal-800">
                {orderType.label} · {sessionId ? 'Session active' : 'No session'}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SelectPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-teal-900">
      {icon}
      <span className="max-w-[9rem] truncate">{label}</span>
      <ChevronDown className="h-3.5 w-3.5 text-teal-600" />
    </div>
  );
}

function CatChip({
  active,
  onClick,
  children,
  tone = 'bg-teal-700 text-white',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition',
        active ? tone : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  );
}
