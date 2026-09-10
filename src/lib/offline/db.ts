import Dexie, { type Table } from 'dexie';

export type OfflineMeta = {
  key: string;
  deviceId: string;
  registerId?: string;
  branchId?: string;
  lastSnapshotAt?: string;
};

export type PosSnapshot = {
  registerId: string;
  data: Record<string, unknown>;
  savedAt: string;
};

export type LocalSession = {
  id: string;
  registerId: string;
  branchId: string;
  openingFloat: number;
  openedAt: string;
  synced: boolean;
  serverSessionId?: string;
};

export type LocalCartItem = {
  productId: string;
  name: unknown;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  options?: Array<{ name: string; group: string; price: number }>;
  notes?: string;
  course?: string;
  taxClass?: string | null;
};

export type LocalCart = {
  uuid: string;
  registerId: string;
  branchId: string;
  sessionId: string;
  items: LocalCartItem[];
  orderType: string;
  guestCount: number;
  tableId?: string | null;
  customerId?: string | null;
  waiterId?: string | null;
  notes?: string;
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  discountTotal: number;
  tipAmount: number;
  loyaltyPointsRedeemed: number;
  discountPct: number;
  total: number;
  promotionId?: string | null;
  voucherCode?: string | null;
  updatedAt: string;
};

export type HeldOrder = {
  id: string;
  registerId: string;
  referenceNo: string;
  items: LocalCartItem[];
  totals: Record<string, number>;
  meta: Record<string, unknown>;
  heldAt: string;
  synced: boolean;
  serverOrderId?: string;
};

export type CompletedOrder = {
  id: string;
  registerId: string;
  referenceNo: string;
  clientOrderId: string;
  payload: Record<string, unknown>;
  total: number;
  status: 'pending_sync' | 'synced' | 'failed';
  createdAt: string;
  serverOrderId?: string;
  serverReferenceNo?: string;
  lastError?: string;
};

export type SyncQueueItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  attempts: number;
  createdAt: string;
  lastError?: string;
};

class ForkivaOfflineDB extends Dexie {
  meta!: Table<OfflineMeta, string>;
  snapshots!: Table<PosSnapshot, string>;
  sessions!: Table<LocalSession, string>;
  carts!: Table<LocalCart, string>;
  held_orders!: Table<HeldOrder, string>;
  completed_orders!: Table<CompletedOrder, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor() {
    super('forkiva_pos_offline');
    this.version(1).stores({
      meta: 'key',
      snapshots: 'registerId',
      sessions: 'id, registerId',
      carts: 'uuid, registerId',
      held_orders: 'id, registerId',
      completed_orders: 'id, registerId, status',
      sync_queue: 'id, status, createdAt',
    });
  }
}

export const offlineDb = new ForkivaOfflineDB();

const DEVICE_KEY = 'forkiva-device-id';

export async function getDeviceId(): Promise<string> {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  const row = await offlineDb.meta.get('device');
  if (!row || row.deviceId !== id) {
    await offlineDb.meta.put({ key: 'device', deviceId: id });
  }
  return id;
}

export async function getPendingSyncCount(): Promise<number> {
  const pending = await offlineDb.sync_queue.where('status').equals('pending').count();
  const failed = await offlineDb.sync_queue.where('status').equals('failed').count();
  const orders = await offlineDb.completed_orders.where('status').equals('pending_sync').count();
  return pending + failed + orders;
}
