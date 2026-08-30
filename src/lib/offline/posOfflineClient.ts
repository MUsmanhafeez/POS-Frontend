import api from '@/lib/api';
import {
  offlineDb,
  getDeviceId,
  type LocalCart,
  type LocalCartItem,
  type HeldOrder,
  type CompletedOrder,
  type SyncQueueItem,
} from './db';
import { pricingFromSnapshot, recalcLocalCart } from './pricing';
import { useConnectivityStore } from '@/stores/connectivity';

function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

export function isOfflineMode(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !navigator.onLine;
}

async function queueEvent(type: string, payload: Record<string, unknown>): Promise<string> {
  const id = uuid();
  const item: SyncQueueItem = {
    id,
    type,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: nowIso(),
  };
  await offlineDb.sync_queue.put(item);
  useConnectivityStore.getState().refreshPending();
  return id;
}

async function nextOfflineRef(registerId: string): Promise<string> {
  const count = await offlineDb.completed_orders.where('registerId').equals(registerId).count();
  const held = await offlineDb.held_orders.where('registerId').equals(registerId).count();
  const n = count + held + 1;
  return `OFF-${String(n).padStart(4, '0')}`;
}

async function getSnapshot(registerId: string) {
  const snap = await offlineDb.snapshots.get(registerId);
  if (!snap) throw new Error('No offline snapshot. Open POS while online first.');
  return snap.data;
}

async function getOpenLocalSession(registerId: string) {
  const sessions = await offlineDb.sessions.where('registerId').equals(registerId).toArray();
  return sessions.find((s) => !s.synced || s.serverSessionId) || sessions[0];
}

export const posOfflineClient = {
  async loadViewer(registerId: string) {
    if (!isOfflineMode()) {
      const { data } = await api.get(`/pos/viewer/${registerId}`);
      await offlineDb.snapshots.put({
        registerId,
        data: data.body as Record<string, unknown>,
        savedAt: nowIso(),
      });
      await offlineDb.meta.put({
        key: 'device',
        deviceId: await getDeviceId(),
        registerId,
        branchId: String(data.body?.branchId ?? data.body?.branch_id ?? ''),
        lastSnapshotAt: nowIso(),
      });
      return data.body as Record<string, unknown>;
    }
    const data = await getSnapshot(registerId);
    const localSession = await getOpenLocalSession(registerId);
    if (localSession && !data.session) {
      data.session = {
        id: localSession.serverSessionId || localSession.id,
        offline: !localSession.serverSessionId,
      };
    }
    return data;
  },

  async loadCustomersAndWaiters() {
    if (isOfflineMode()) {
      const snap = await offlineDb.snapshots.toCollection().first();
      const cached = (snap?.data?.cachedCustomers as Array<Record<string, unknown>>) || [];
      const cachedWaiters = (snap?.data?.cachedWaiters as Array<Record<string, unknown>>) || [];
      return { customers: cached, waiters: cachedWaiters };
    }
    const [c, u] = await Promise.all([api.get('/customers'), api.get('/users')]);
    const customers = c.data.body || [];
    const waiters = u.data.body || [];
    const registerId = (await offlineDb.meta.get('device'))?.registerId;
    if (registerId) {
      const snap = await offlineDb.snapshots.get(registerId);
      if (snap) {
        snap.data.cachedCustomers = customers;
        snap.data.cachedWaiters = waiters;
        await offlineDb.snapshots.put(snap);
      }
    }
    return { customers, waiters };
  },

  async openSession(registerId: string, openingFloat: number) {
    if (!isOfflineMode()) {
      const { data } = await api.post('/pos/sessions/open', {
        pos_register_id: registerId,
        opening_float: openingFloat,
      });
      return data.body as Record<string, unknown>;
    }
    const snapshot = await getSnapshot(registerId);
    const branchId = String(snapshot.branchId ?? snapshot.branch_id ?? '');
    const localId = uuid();
    const session = {
      id: localId,
      registerId,
      branchId,
      openingFloat,
      openedAt: nowIso(),
      synced: false,
    };
    await offlineDb.sessions.put(session);
    await queueEvent('session.open', {
      client_session_id: localId,
      pos_register_id: registerId,
      opening_float: openingFloat,
      branch_id: branchId,
    });
    return { id: localId, status: 'open', openingFloat, offline: true };
  },

  async getXReport(registerId: string, sessionId: string) {
    if (!isOfflineMode()) {
      const { data } = await api.get('/reports/xz', {
        params: { type: 'X', session_id: sessionId, register_id: registerId },
      });
      return data.body;
    }
    const completed = await offlineDb.completed_orders
      .where('registerId')
      .equals(registerId)
      .and((o) => o.status === 'pending_sync')
      .toArray();
    const salesTotal = completed.reduce((s, o) => s + Number(o.total || 0), 0);
    return {
      offline: true,
      sales: { orders_count: completed.length, sales_total: salesTotal },
    };
  },

  async ensureCart(
    registerId: string,
    sessionId: string,
    opts: { branchId: string; orderType: string; guestCount: number }
  ): Promise<string> {
    const existing = await offlineDb.carts.where('registerId').equals(registerId).first();
    if (existing) return existing.uuid;

    if (!isOfflineMode()) {
      const { data } = await api.post('/cart', {
        branch_id: opts.branchId,
        pos_register_id: registerId,
        pos_session_id: sessionId,
        order_type: opts.orderType,
        guest_count: opts.guestCount,
      });
      const uuid = data.body.uuid as string;
      return uuid;
    }

    const cartUuid = uuid();
    const cart: LocalCart = {
      uuid: cartUuid,
      registerId,
      branchId: opts.branchId,
      sessionId,
      items: [],
      orderType: opts.orderType,
      guestCount: opts.guestCount,
      subtotal: 0,
      taxTotal: 0,
      serviceCharge: 0,
      discountTotal: 0,
      tipAmount: 0,
      loyaltyPointsRedeemed: 0,
      discountPct: 0,
      total: 0,
      updatedAt: nowIso(),
    };
    await offlineDb.carts.put(cart);
    return cartUuid;
  },

  async getCartBody(cartUuid: string): Promise<Record<string, unknown>> {
    if (!isOfflineMode()) {
      const { data } = await api.get(`/cart/${cartUuid}`);
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    return mapCartToApi(cart);
  },

  async patchCart(cartUuid: string, patch: Record<string, unknown>) {
    if (!isOfflineMode()) {
      const { data } = await api.patch(`/cart/${cartUuid}`, patch);
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const snapshot = await getSnapshot(cart.registerId);
    const ctx = pricingFromSnapshot(snapshot);
    if (patch.order_type) cart.orderType = String(patch.order_type);
    if (patch.guest_count != null) cart.guestCount = Number(patch.guest_count);
    if (patch.table_id !== undefined) cart.tableId = patch.table_id as string | null;
    if (patch.customer_id !== undefined) cart.customerId = patch.customer_id as string | null;
    if (patch.waiter_id !== undefined) cart.waiterId = patch.waiter_id as string | null;
    if (patch.notes !== undefined) cart.notes = String(patch.notes || '');
    if (patch.tip_amount != null) cart.tipAmount = Number(patch.tip_amount);
    const recalc = recalcLocalCart(cart, ctx);
    await offlineDb.carts.put({ ...recalc, updatedAt: nowIso() });
    return mapCartToApi(recalc);
  },

  async addCartItem(
    cartUuid: string,
    item: {
      product_id: string;
      qty: number;
      unit_price: number;
      options?: LocalCartItem['options'];
      notes?: string;
      course?: string;
      name?: unknown;
      tax_class?: string | null;
    }
  ) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/items`, item);
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const snapshot = await getSnapshot(cart.registerId);
    const ctx = pricingFromSnapshot(snapshot);
    const line: LocalCartItem = {
      productId: item.product_id,
      name: item.name || 'Item',
      qty: item.qty,
      unitPrice: item.unit_price,
      lineTotal: Math.round(item.unit_price * item.qty * 100) / 100,
      options: item.options,
      notes: item.notes,
      course: item.course,
      taxClass: item.tax_class,
    };
    cart.items.push(line);
    const recalc = recalcLocalCart(cart, ctx);
    await offlineDb.carts.put({ ...recalc, updatedAt: nowIso() });
    return mapCartToApi(recalc);
  },

  async removeCartItem(cartUuid: string, index: number) {
    if (!isOfflineMode()) {
      const { data } = await api.delete(`/cart/${cartUuid}/items/${index}`);
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const snapshot = await getSnapshot(cart.registerId);
    const ctx = pricingFromSnapshot(snapshot);
    cart.items.splice(index, 1);
    const recalc = recalcLocalCart(cart, ctx);
    await offlineDb.carts.put({ ...recalc, updatedAt: nowIso() });
    return mapCartToApi(recalc);
  },

  async applyDiscount(cartUuid: string, percent: number, managerPin?: string) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/apply-discount`, {
        percent,
        manager_pin: managerPin,
      });
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const snapshot = await getSnapshot(cart.registerId);
    const ctx = pricingFromSnapshot(snapshot);
    cart.discountPct = percent;
    cart.discountTotal = 0;
    const recalc = recalcLocalCart(cart, ctx);
    await offlineDb.carts.put({ ...recalc, updatedAt: nowIso() });
    return mapCartToApi(recalc);
  },

  async applyLoyalty(cartUuid: string, points: number) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/apply-loyalty`, { points });
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const snapshot = await getSnapshot(cart.registerId);
    const ctx = pricingFromSnapshot(snapshot);
    cart.loyaltyPointsRedeemed = points;
    const recalc = recalcLocalCart(cart, ctx);
    await offlineDb.carts.put({ ...recalc, updatedAt: nowIso() });
    return mapCartToApi(recalc);
  },

  async applyPromotion(cartUuid: string, promotionId: string) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/apply-promotion`, { promotion_id: promotionId });
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    cart.promotionId = promotionId;
    await offlineDb.carts.put({ ...cart, updatedAt: nowIso() });
    return mapCartToApi(cart);
  },

  async applyCoupon(cartUuid: string, code: string) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/apply-coupon`, { code });
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    cart.voucherCode = code;
    await offlineDb.carts.put({ ...cart, updatedAt: nowIso() });
    return mapCartToApi(cart);
  },

  async hold(cartUuid: string) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/hold`);
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const ref = await nextOfflineRef(cart.registerId);
    const heldId = uuid();
    const held: HeldOrder = {
      id: heldId,
      registerId: cart.registerId,
      referenceNo: ref,
      items: [...cart.items],
      totals: {
        subtotal: cart.subtotal,
        taxTotal: cart.taxTotal,
        serviceCharge: cart.serviceCharge,
        discountTotal: cart.discountTotal,
        total: cart.total,
      },
      meta: {
        sessionId: cart.sessionId,
        branchId: cart.branchId,
        orderType: cart.orderType,
        tableId: cart.tableId,
        customerId: cart.customerId,
        waiterId: cart.waiterId,
        notes: cart.notes,
        guestCount: cart.guestCount,
      },
      heldAt: nowIso(),
      synced: false,
    };
    await offlineDb.held_orders.put(held);
    await queueEvent('order.hold', {
      client_order_id: heldId,
      reference_no: ref,
      cart: buildCheckoutPayload(cart, { markPaid: false, held: true }),
    });
    await offlineDb.carts.delete(cartUuid);
    useConnectivityStore.getState().refreshPending();
    return { referenceNo: ref, orderNumber: ref, offline: true };
  },

  async checkout(
    cartUuid: string,
    opts: {
      markPaid: boolean;
      payments?: Array<{ method: string; amount: number; reference?: string }>;
      tipAmount?: number;
      sendReceipt?: boolean;
    }
  ) {
    if (!isOfflineMode()) {
      const { data } = await api.post(`/cart/${cartUuid}/checkout`, {
        mark_paid: opts.markPaid,
        payments: opts.payments,
        tip_amount: opts.tipAmount,
        send_receipt: opts.sendReceipt,
      });
      return data.body as Record<string, unknown>;
    }
    const cart = await offlineDb.carts.get(cartUuid);
    if (!cart) throw new Error('Cart not found');
    const clientOrderId = uuid();
    const ref = await nextOfflineRef(cart.registerId);
    const payload = buildCheckoutPayload(cart, opts);
    const completed: CompletedOrder = {
      id: clientOrderId,
      registerId: cart.registerId,
      referenceNo: ref,
      clientOrderId,
      payload,
      total: cart.total,
      status: 'pending_sync',
      createdAt: nowIso(),
    };
    await offlineDb.completed_orders.put(completed);
    await queueEvent('order.checkout', {
      client_order_id: clientOrderId,
      reference_no: ref,
      ...payload,
    });
    await offlineDb.carts.delete(cartUuid);
    useConnectivityStore.getState().refreshPending();
    return { referenceNo: ref, orderNumber: ref, id: clientOrderId, offline: true };
  },

  async updateTableStatus(tableId: string, status: string) {
    if (!isOfflineMode()) {
      await api.put(`/tables/${tableId}`, { status });
      return;
    }
    await queueEvent('table.status', { table_id: tableId, status });
  },

  async listPromotions(branchId: string) {
    if (!isOfflineMode()) {
      const { data } = await api.get('/promotions', { params: { branch_id: branchId } });
      return data.body || [];
    }
    const snap = await offlineDb.snapshots.toCollection().first();
    return (snap?.data?.promotions as unknown[]) || [];
  },

  async listPendingSync() {
    const queue = await offlineDb.sync_queue
      .where('status')
      .anyOf(['pending', 'failed'])
      .toArray();
    const orders = await offlineDb.completed_orders.where('status').equals('pending_sync').toArray();
    return { queue, orders };
  },
};

function mapCartToApi(cart: LocalCart): Record<string, unknown> {
  return {
    uuid: cart.uuid,
    items: cart.items,
    subtotal: cart.subtotal,
    taxTotal: cart.taxTotal,
    tax_total: cart.taxTotal,
    serviceCharge: cart.serviceCharge,
    service_charge: cart.serviceCharge,
    discountTotal: cart.discountTotal,
    discount_total: cart.discountTotal,
    tipAmount: cart.tipAmount,
    tip_amount: cart.tipAmount,
    loyaltyPointsRedeemed: cart.loyaltyPointsRedeemed,
    loyalty_points_redeemed: cart.loyaltyPointsRedeemed,
    total: cart.total,
    orderType: cart.orderType,
    guestCount: cart.guestCount,
    tableId: cart.tableId,
    customerId: cart.customerId,
    waiterId: cart.waiterId,
    notes: cart.notes,
  };
}

function buildCheckoutPayload(
  cart: LocalCart,
  opts: {
    markPaid: boolean;
    payments?: Array<{ method: string; amount: number; reference?: string }>;
    tipAmount?: number;
    sendReceipt?: boolean;
    held?: boolean;
  }
) {
  return {
    branch_id: cart.branchId,
    pos_register_id: cart.registerId,
    pos_session_id: cart.sessionId,
    order_type: cart.orderType,
    table_id: cart.tableId,
    customer_id: cart.customerId,
    waiter_id: cart.waiterId,
    guest_count: cart.guestCount,
    notes: cart.notes,
    items: cart.items,
    subtotal: cart.subtotal,
    tax_total: cart.taxTotal,
    service_charge: cart.serviceCharge,
    discount_total: cart.discountTotal,
    tip_amount: opts.tipAmount ?? cart.tipAmount,
    loyalty_points_redeemed: cart.loyaltyPointsRedeemed,
    promotion_id: cart.promotionId,
    voucher_code: cart.voucherCode,
    mark_paid: opts.markPaid,
    held: opts.held ?? false,
    payments: opts.payments || [],
    send_receipt: opts.sendReceipt ?? false,
  };
}
