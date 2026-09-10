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
  UserRound,
  Users,
  UtensilsCrossed,
  X,
  ChefHat,
} from 'lucide-react';
import clsx from 'clsx';
import { posOfflineClient } from '@/lib/offline/posOfflineClient';
import OfflineBanner from '@/components/pos/OfflineBanner';
import { useAuthStore } from '@/stores/auth';
import { labelOf } from '@/lib/ui';
import {
  POS_MODULE_ITEMS,
  PosHomeDeliveryModal,
  PosModules,
  PosOrderTypeFields,
  type PosModuleId,
} from '@/components/pos/PosModules';
import ModifierModal, { type ProductOption } from '@/components/pos/ModifierModal';
import PaymentModal, { type PaymentLine } from '@/components/pos/PaymentModal';
import ComboPickerModal, { type ComboItem } from '@/components/pos/ComboPickerModal';
import ShiftCloseModal from '@/components/pos/ShiftCloseModal';

type CartItem = {
  productId: string;
  name: unknown;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  options?: Array<{ name: string; group: string; price: number }>;
  notes?: string;
};

type CartTotals = {
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  discountTotal: number;
  tipAmount: number;
  loyaltyPointsRedeemed: number;
  total: number;
};

type OrderType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  accent: string;
};

const ORDER_TYPE_ALIASES: Record<string, string> = {
  dine_in: 'dine_in',
  takeaway: 'takeaway',
  delivery: 'home_delivery',
  pick_up: 'pick_up',
  home_delivery: 'home_delivery',
  drive_thru: 'drive_thru',
  pre_order: 'pre_order',
  food_panda: 'food_panda',
  golootlo: 'golootlo',
};

function parseEnabledOrderTypeIds(settings: Record<string, unknown> | null | undefined): string[] | null {
  const raw = settings?.order_types_enabled ?? settings?.orderTypesEnabled;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function filterOrderTypes(settings: Record<string, unknown> | null | undefined): OrderType[] {
  const enabled = parseEnabledOrderTypeIds(settings);
  if (!enabled?.length) return ORDER_TYPES;
  const ids = new Set(enabled.map((e) => ORDER_TYPE_ALIASES[e] || e));
  const filtered = ORDER_TYPES.filter((t) => ids.has(t.id) || ids.has(t.value));
  return filtered.length ? filtered : ORDER_TYPES;
}

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

const MODULES = POS_MODULE_ITEMS;

const MANAGER_ROLES = new Set(['super_admin', 'hq_admin', 'admin', 'branch_manager', 'shift_supervisor', 'regional_manager']);

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
    options: i.options as CartItem['options'],
    notes: i.notes as string | undefined,
  }));
}

function mapCartTotals(body: Record<string, unknown>): CartTotals {
  return {
    subtotal: Number(body.subtotal ?? 0),
    taxTotal: Number(body.taxTotal ?? body.tax_total ?? 0),
    serviceCharge: Number(body.serviceCharge ?? body.service_charge ?? 0),
    discountTotal: Number(body.discountTotal ?? body.discount_total ?? 0),
    tipAmount: Number(body.tipAmount ?? body.tip_amount ?? 0),
    loyaltyPointsRedeemed: Number(body.loyaltyPointsRedeemed ?? body.loyalty_points_redeemed ?? 0),
    total: Number(body.total ?? 0),
  };
}

export default function PosViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, logout, can } = useAuthStore();
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
  const [activeModule, setActiveModule] = useState<PosModuleId | null>(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [orderMeta, setOrderMeta] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email?: string; loyalty_points?: number }>>([]);
  const [waiters, setWaiters] = useState<Array<{ id: string; name: string }>>([]);
  const [customerId, setCustomerId] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [cartTotals, setCartTotals] = useState<CartTotals>({
    subtotal: 0,
    taxTotal: 0,
    serviceCharge: 0,
    discountTotal: 0,
    tipAmount: 0,
    loyaltyPointsRedeemed: 0,
    total: 0,
  });
  const [modifierProduct, setModifierProduct] = useState<Record<string, unknown> | null>(null);
  const [comboProduct, setComboProduct] = useState<Record<string, unknown> | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountPct, setDiscountPct] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [floatOpen, setFloatOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('');
  const [discountPin, setDiscountPin] = useState('');
  const [shiftCloseOpen, setShiftCloseOpen] = useState(false);
  const [promotionsOpen, setPromotionsOpen] = useState(false);
  const [promotions, setPromotions] = useState<Array<{ id: string; name: string; type?: string; value?: number }>>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [customerLoyaltyBalance, setCustomerLoyaltyBalance] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);

  const register = boot?.register as Record<string, unknown> | undefined;
  const branchSettings = (boot?.settings as Record<string, unknown> | null) || null;
  const enabledOrderTypes = useMemo(() => filterOrderTypes(branchSettings), [branchSettings]);
  const pricing = boot?.pricing as {
    currency?: string;
    taxRate?: number;
    serviceChargePct?: number;
    quickPayAmounts?: number[];
    paymentMethods?: string[];
  } | undefined;
  const products = (boot?.products as Array<Record<string, unknown>>) || [];
  const categories = (boot?.categories as Array<Record<string, unknown>>) || [];
  const menus = (boot?.menus as Array<Record<string, unknown>>) || [];
  const currency = pricing?.currency || 'PKR';
  const taxLabel = pricing?.taxRate
    ? `Tax (${Number(pricing.taxRate) > 1 ? pricing.taxRate : Number(pricing.taxRate) * 100}%)`
    : 'Tax';
  const showAdminLink = MANAGER_ROLES.has(user?.role?.name || '') || can('admin.settings.index');

  const filteredCategories = useMemo(() => {
    if (menuId === 'all') return categories;
    return categories.filter((c) => String(c.menuId) === menuId);
  }, [categories, menuId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (p.isAvailable === false) return false;
      if (menuId !== 'all' && String(p.menuId) !== menuId) return false;
      if (categoryId === 'all') return true;
      return ((p.categoryIds as string[]) || []).includes(categoryId);
    });
  }, [products, menuId, categoryId]);

  const subtotal = cartTotals.subtotal;
  const vat = cartTotals.taxTotal;
  const serviceCharge = cartTotals.serviceCharge;
  const discountTotal = cartTotals.discountTotal;
  const total = cartTotals.total;
  const orderType = enabledOrderTypes.find((t) => t.id === orderTypeId) || enabledOrderTypes[0] || ORDER_TYPES[0];
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerEmail = selectedCustomer?.email || null;

  async function load() {
    const body = await posOfflineClient.loadViewer(registerId);
    setBoot(body);
    setSessionId((body.session as { id?: string })?.id || null);
  }

  useEffect(() => {
    load().catch(console.error);
    setDark(localStorage.getItem('forkiva-theme') === 'dark');
    posOfflineClient.loadCustomersAndWaiters()
      .then(({ customers: cList, waiters: wList }) => {
        setCustomers(
          (cList || []).map((x: { id: string; name: string; email?: string; loyalty_points?: number; loyaltyPoints?: number }) => ({
            id: x.id,
            name: x.name,
            email: x.email,
            loyalty_points: Number(x.loyalty_points ?? x.loyaltyPoints ?? 0),
          }))
        );
        setWaiters((wList || []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      })
      .catch(() => undefined);
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
    setFloatOpen(true);
  }

  async function confirmOpenSession() {
    setBusy(true);
    try {
      const float = Number(openingFloat || 0);
      const body = await posOfflineClient.openSession(registerId, float);
      setSessionId(body.id as string);
      setMessage('Session opened');
      setFloatOpen(false);
      setOpeningFloat('');
      await load();
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not open session');
    } finally {
      setBusy(false);
    }
  }

  async function runXReport() {
    if (!sessionId) return;
    try {
      const body = await posOfflineClient.getXReport(registerId, sessionId);
      const sales = body.sales as { sales_total?: number; orders_count?: number };
      setMessage(`X Report: ${sales?.orders_count || 0} orders · ${money(Number(sales?.sales_total || 0), currency)}`);
    } catch {
      setMessage('Could not load X report');
    }
  }

  async function ensureCart() {
    if (cartUuid) return cartUuid;
    const uuid = await posOfflineClient.ensureCart(registerId, sessionId!, {
      branchId: String(register?.branchId ?? boot?.branchId ?? boot?.branch_id ?? ''),
      orderType: orderType.value,
      guestCount: guestCount,
    });
    setCartUuid(uuid);
    return uuid;
  }

  async function syncCartMeta(uuid: string, patch: Record<string, unknown>) {
    const body = await posOfflineClient.patchCart(uuid, patch);
    setCartTotals(mapCartTotals(body));
  }

  function applyCartResponse(body: Record<string, unknown>) {
    setItems(mapCartItems((body.items as Array<Record<string, unknown>>) || []));
    setCartTotals(mapCartTotals(body));
  }

  async function addProduct(p: Record<string, unknown>) {
    if (!sessionId) {
      setMessage('Open a POS session first');
      return;
    }
    const options = (p.options as ProductOption[]) || [];
    if (p.isCombo || p.is_combo) {
      setComboProduct(p);
      return;
    }
    if (options.length > 0) {
      setModifierProduct(p);
      return;
    }
    await addProductToCart(p, [], '');
  }

  async function addProductToCart(
    p: Record<string, unknown>,
    options: Array<{ name: string; group: string; price: number }>,
    notes: string,
    course?: string
  ) {
    setBusy(true);
    try {
      const uuid = await ensureCart();
      const price = Number(p.effectivePrice ?? p.specialPrice ?? p.price ?? 0);
      const body = await posOfflineClient.addCartItem(uuid, {
        product_id: String(p.id),
        qty: 1,
        unit_price: price,
        options,
        notes,
        course: course || undefined,
        name: p.name,
        tax_class: (p.taxClass as string) || (p.tax_class as string) || null,
      });
      applyCartResponse(body);
      setOrderPanelOpen(true);
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not add item');
    } finally {
      setBusy(false);
    }
  }

  async function onCustomerChange(id: string) {
    setCustomerId(id);
    if (cartUuid && id && id !== 'walk-in') {
      await syncCartMeta(cartUuid, { customer_id: id }).catch(() => undefined);
      const cust = customers.find((c) => c.id === id);
      setCustomerLoyaltyBalance(Number(cust?.loyalty_points || 0));
    } else {
      setCustomerLoyaltyBalance(0);
    }
  }

  async function onWaiterChange(id: string) {
    setWaiterId(id);
    if (cartUuid && id) {
      await syncCartMeta(cartUuid, { waiter_id: id }).catch(() => undefined);
    }
  }

  async function onSelectTable(tableId: string, tableName: string) {
    setOrderMeta((m) => ({ ...m, table_id: tableId, table_name: tableName }));
    setOrderTypeId('dine_in');
    if (sessionId) {
      const uuid = cartUuid || (await ensureCart());
      await syncCartMeta(uuid, { table_id: tableId, order_type: 'dine_in' });
    }
  }

  async function removeItem(index: number) {
    if (!cartUuid) return;
    const body = await posOfflineClient.removeCartItem(cartUuid, index);
    applyCartResponse(body);
  }

  async function clearOrder() {
    setCartUuid(null);
    setItems([]);
    setNotes('');
    setGuestCount(1);
    setCartTotals({ subtotal: 0, taxTotal: 0, serviceCharge: 0, discountTotal: 0, tipAmount: 0, loyaltyPointsRedeemed: 0, total: 0 });
    setMessage('Order cleared');
  }

  async function changeOrderType(id: string) {
    setOrderTypeId(id);
    const next = enabledOrderTypes.find((t) => t.id === id) || ORDER_TYPES.find((t) => t.id === id);
    if (cartUuid && next) {
      await syncCartMeta(cartUuid, { order_type: next.value }).catch(() => undefined);
    }
    if (id === 'home_delivery' && !orderMeta.address) {
      setDeliveryOpen(true);
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
      if (!items.length) {
        setMessage('Add items before holding');
        return;
      }
      if (!sessionId) {
        setMessage('Open a POS session first');
        return;
      }
      setBusy(true);
      try {
        const uuid = await ensureCart();
        await syncCartMeta(uuid, {
          notes: notes,
          customer_id: customerId && customerId !== 'walk-in' ? customerId : null,
          waiter_id: waiterId || null,
        });
        const body = await posOfflineClient.hold(uuid);
        setMessage(`Held ${body.referenceNo || body.orderNumber}`);
        setCartUuid(null);
        setItems([]);
        setNotes('');
        setCartTotals({ subtotal: 0, taxTotal: 0, serviceCharge: 0, discountTotal: 0, tipAmount: 0, loyaltyPointsRedeemed: 0, total: 0 });
      } catch (err: unknown) {
        setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Hold failed');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (mode === 'pay') {
      if (!items.length) {
        setMessage('Add items before continuing');
        return;
      }
      setPaymentOpen(true);
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
      const metaNote = Object.entries(orderMeta)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      const mergedNotes = [notes, metaNote].filter(Boolean).join('\n');
      await syncCartMeta(uuid, {
        notes: mergedNotes,
        customer_id: customerId && customerId !== 'walk-in' ? customerId : null,
        waiter_id: waiterId || null,
      });
      const body = await posOfflineClient.checkout(uuid, { markPaid: false });
      setMessage(`Sent to kitchen ${body.referenceNo}`);
      setCartUuid(null);
      setItems([]);
      setNotes('');
      setCartTotals({ subtotal: 0, taxTotal: 0, serviceCharge: 0, discountTotal: 0, tipAmount: 0, loyaltyPointsRedeemed: 0, total: 0 });
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  async function completePayment(payments: PaymentLine[], tipAmount: number, sendReceipt: boolean) {
    setBusy(true);
    try {
      const uuid = await ensureCart();
      const metaNote = Object.entries(orderMeta)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      const mergedNotes = [notes, metaNote].filter(Boolean).join('\n');
      await syncCartMeta(uuid, {
        notes: mergedNotes,
        customer_id: customerId && customerId !== 'walk-in' ? customerId : null,
        waiter_id: waiterId || null,
        tip_amount: tipAmount,
      });
      const body = await posOfflineClient.checkout(uuid, {
        markPaid: true,
        payments,
        tipAmount,
        sendReceipt,
      });
      setMessage(`Paid ${body.referenceNo}`);
      if (orderMeta.table_id) {
        await posOfflineClient.updateTableStatus(String(orderMeta.table_id), 'dirty');
      }
      setCartUuid(null);
      setItems([]);
      setNotes('');
      setCartTotals({ subtotal: 0, taxTotal: 0, serviceCharge: 0, discountTotal: 0, tipAmount: 0, loyaltyPointsRedeemed: 0, total: 0 });
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  }

  async function applyDiscount() {
    if (!cartUuid) {
      setMessage('Add items first');
      return;
    }
    const pct = Number(discountPct || 0);
    if (!discountPin) {
      setMessage('Manager PIN required for discounts');
      return;
    }
    await applyDiscountWithPin(pct, discountPin);
  }

  async function applyLoyalty() {
    if (!cartUuid || !loyaltyPoints) return;
    const body = await posOfflineClient.applyLoyalty(cartUuid, Number(loyaltyPoints));
    applyCartResponse(body);
    setLoyaltyPoints('');
    setMessage('Loyalty points applied');
  }

  async function applyPromotion(promotionId: string) {
    if (!cartUuid) return;
    const body = await posOfflineClient.applyPromotion(cartUuid, promotionId);
    applyCartResponse(body);
    setPromotionsOpen(false);
    setMessage('Promotion applied');
  }

  async function openPromotions() {
    const branchId = String(register?.branchId ?? boot?.branchId ?? boot?.branch_id ?? '');
    const list = await posOfflineClient.listPromotions(branchId);
    setPromotions((list || []) as Array<{ id: string; name: string; type?: string; value?: number }>);
    setPromotionsOpen(true);
  }

  async function applyDiscountWithPin(pct: number, pin?: string) {
    if (!cartUuid) return;
    const body = await posOfflineClient.applyDiscount(cartUuid, pct, pin);
    applyCartResponse(body);
    setDiscountOpen(false);
    setDiscountPct('');
    setDiscountPin('');
    setMessage('Discount applied');
  }

  async function applyCoupon() {
    if (!cartUuid || !couponCode.trim()) return;
    const body = await posOfflineClient.applyCoupon(cartUuid, couponCode.trim());
    applyCartResponse(body);
    setCouponCode('');
    setMessage('Coupon applied');
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
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-teal-50 via-[#f4f7f6] to-orange-50 text-slate-900">
      <OfflineBanner />
      <div className="flex min-h-0 flex-1 overflow-hidden">
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
          {enabledOrderTypes.map((type) => {
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
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className="mb-1 flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-teal-50 transition hover:bg-white/10"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold leading-tight">{mod.label}</span>
              </button>
            );
          })}
          {showAdminLink && (
          <Link
            href="/admin"
            className="mt-1 flex w-full flex-col items-center gap-1 rounded-xl bg-orange-500/20 px-2 py-2.5 text-center text-orange-100 transition hover:bg-orange-500/30"
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[11px] font-semibold">Admin</span>
          </Link>
          )}
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
              <>
                <span className="btn-solid inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-500 px-3 text-sm font-bold !text-white shadow-sm">
                  Session open
                </span>
                <button
                  type="button"
                  onClick={runXReport}
                  className="inline-flex h-9 items-center rounded-full border border-teal-300 bg-white px-3 text-sm font-bold text-teal-800 hover:bg-teal-50"
                >
                  X Report
                </button>
                <button
                  type="button"
                  onClick={() => setShiftCloseOpen(true)}
                  className="inline-flex h-9 items-center rounded-full border border-orange-300 bg-orange-50 px-3 text-sm font-bold text-orange-800 hover:bg-orange-100"
                >
                  Z Report / Close
                </button>
              </>
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
                        {money(Number(p.effectivePrice ?? p.specialPrice ?? p.price ?? 0), currency)}
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
                  <select
                    className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-teal-500"
                    value={waiterId}
                    onChange={(e) => onWaiterChange(e.target.value)}
                  >
                    <option value="">Select Waiter</option>
                    {waiters.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </label>
                <div className="flex gap-2">
                  <label className="relative block flex-1">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" />
                    <select
                      className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-sky-500"
                      value={customerId}
                      onChange={(e) => onCustomerChange(e.target.value)}
                    >
                      <option value="">Select Customer</option>
                      <option value="walk-in">Walk-in</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
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
                          {item.options?.length ? (
                            <div className="mt-1 text-[11px] text-slate-500">
                              {item.options.map((o) => `${o.group}: ${o.name}`).join(', ')}
                            </div>
                          ) : null}
                          {item.notes ? <div className="mt-0.5 text-[11px] italic text-slate-500">{item.notes}</div> : null}
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
              <PosOrderTypeFields
                orderTypeId={orderTypeId}
                meta={orderMeta}
                onChange={(patch) => setOrderMeta((m) => ({ ...m, ...patch }))}
                onOpenDelivery={() => setDeliveryOpen(true)}
              />

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
                <button type="button" className="h-10 rounded-xl border border-amber-300 bg-amber-50 text-sm font-bold text-amber-800 hover:bg-amber-100" onClick={() => setDiscountOpen(true)}>
                  Discount
                </button>
                <button type="button" className="h-10 rounded-xl border border-violet-300 bg-violet-50 text-sm font-bold text-violet-800 hover:bg-violet-100" onClick={() => setCouponOpen(true)}>
                  Voucher
                </button>
                <button type="button" className="h-10 rounded-xl border border-teal-300 bg-teal-50 text-sm font-bold text-teal-800 hover:bg-teal-100" onClick={openPromotions}>
                  Promotions
                </button>
                {customerId && customerId !== 'walk-in' ? (
                  <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-xs">
                    <div className="font-bold text-emerald-900">Loyalty balance: {customerLoyaltyBalance} pts</div>
                    <div className="mt-1 flex gap-2">
                      <input
                        className="h-8 flex-1 rounded-lg border px-2"
                        placeholder="Points to redeem"
                        value={loyaltyPoints}
                        onChange={(e) => setLoyaltyPoints(e.target.value)}
                      />
                      <button type="button" className="rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white" onClick={applyLoyalty}>
                        Redeem
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mb-3 space-y-1.5 rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{money(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>{taxLabel}</span>
                  <span className="font-bold text-slate-900">{money(vat, currency)}</span>
                </div>
                {serviceCharge > 0 && (
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Service charge</span>
                    <span className="font-bold text-slate-900">{money(serviceCharge, currency)}</span>
                  </div>
                )}
                {discountTotal > 0 && (
                  <div className="flex justify-between font-medium text-rose-700">
                    <span>Discount</span>
                    <span className="font-bold">−{money(discountTotal, currency)}</span>
                  </div>
                )}
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

      <PosModules
        active={activeModule}
        onClose={() => setActiveModule(null)}
        sessionId={sessionId}
        branchId={String(register?.branchId || '')}
        currency={currency}
        onSelectTable={onSelectTable}
      />
      <ModifierModal
        open={modifierProduct !== null}
        productName={modifierProduct?.name}
        options={(modifierProduct?.options as ProductOption[]) || []}
        onClose={() => setModifierProduct(null)}
        onConfirm={(options, notes, course) => {
          if (modifierProduct) addProductToCart(modifierProduct, options, notes, course);
          setModifierProduct(null);
        }}
      />
      <ComboPickerModal
        open={comboProduct !== null}
        productName={comboProduct?.name}
        comboPrice={Number(comboProduct?.effectivePrice ?? comboProduct?.price ?? 0)}
        currency={currency}
        items={(comboProduct?.comboItems as ComboItem[]) || []}
        onClose={() => setComboProduct(null)}
        onConfirm={(notes) => {
          if (comboProduct) addProductToCart(comboProduct, [], notes);
          setComboProduct(null);
        }}
      />
      <PaymentModal
        open={paymentOpen}
        total={total}
        currency={currency}
        quickPayAmounts={pricing?.quickPayAmounts}
        paymentMethods={pricing?.paymentMethods}
        breakdown={{
          subtotal,
          discountTotal,
          loyaltyRedeemed: cartTotals.loyaltyPointsRedeemed,
          taxTotal: vat,
          serviceCharge,
        }}
        customerEmail={customerEmail}
        onClose={() => setPaymentOpen(false)}
        onConfirm={completePayment}
      />
      {discountOpen && (
        <>
          <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={() => setDiscountOpen(false)} aria-label="Close" />
          <div className="fixed left-1/2 top-1/2 z-[110] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Apply discount</h3>
            <label className="mt-3 block text-xs font-bold text-slate-700">
              Percent (%)
              <input
                type="number"
                min={0}
                max={100}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
              />
            </label>
            {Number(discountPct) > 0 && (
              <label className="mt-3 block text-xs font-bold text-slate-700">
                Manager PIN (required)
                <input
                  type="password"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  value={discountPin}
                  onChange={(e) => setDiscountPin(e.target.value)}
                />
              </label>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-xl border py-2 text-sm font-bold" onClick={() => setDiscountOpen(false)}>Cancel</button>
              <button type="button" className="btn-solid flex-1 rounded-xl bg-amber-500 py-2 text-sm font-bold !text-white" onClick={applyDiscount}>Apply</button>
            </div>
          </div>
        </>
      )}
      {couponOpen && (
        <>
          <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={() => setCouponOpen(false)} aria-label="Close" />
          <div className="fixed left-1/2 top-1/2 z-[110] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Apply voucher</h3>
            <input
              className="mt-3 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-xl border py-2 text-sm font-bold" onClick={() => setCouponOpen(false)}>Cancel</button>
              <button
                type="button"
                className="btn-solid flex-1 rounded-xl bg-violet-600 py-2 text-sm font-bold !text-white"
                onClick={() => {
                  applyCoupon();
                  setCouponOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
      {promotionsOpen && (
        <>
          <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={() => setPromotionsOpen(false)} aria-label="Close" />
          <div className="fixed left-1/2 top-1/2 z-[110] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Eligible promotions</h3>
            <p className="mt-1 text-xs text-slate-500">Promotion OR voucher — not both.</p>
            <ul className="mt-3 space-y-2">
              {promotions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-left text-sm font-semibold text-teal-900 hover:bg-teal-100"
                    onClick={() => applyPromotion(p.id)}
                  >
                    {p.name} — {p.type === 'percent' ? `${p.value}%` : p.value}
                  </button>
                </li>
              ))}
              {!promotions.length ? <li className="text-sm text-slate-500">No active promotions</li> : null}
            </ul>
          </div>
        </>
      )}
      <ShiftCloseModal
        open={shiftCloseOpen}
        sessionId={sessionId}
        currency={currency}
        onClose={() => setShiftCloseOpen(false)}
        onClosed={() => {
          setSessionId(null);
          setShiftCloseOpen(false);
        }}
      />
      {floatOpen && (
        <>
          <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={() => setFloatOpen(false)} aria-label="Close" />
          <div className="fixed left-1/2 top-1/2 z-[110] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Opening float</h3>
            <p className="mt-1 text-sm text-slate-600">Enter cash in drawer before starting shift.</p>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-3 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
              placeholder="Opening float amount"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-xl border py-2 text-sm font-bold" onClick={() => setFloatOpen(false)}>Cancel</button>
              <button type="button" disabled={busy} className="btn-solid flex-1 rounded-xl bg-teal-600 py-2 text-sm font-bold !text-white disabled:opacity-50" onClick={confirmOpenSession}>
                Open session
              </button>
            </div>
          </div>
        </>
      )}
      <PosHomeDeliveryModal
        open={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        initial={orderMeta}
        onConfirm={(data) => {
          const address = data.address || [data.block, data.street, data.area, data.city].filter(Boolean).join(', ');
          setOrderMeta((m) => ({ ...m, ...data, address: address || m.address }));
        }}
      />
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
