import api from '@/lib/api';
import { offlineDb, getDeviceId } from './db';
import { posOfflineClient } from './posOfflineClient';
import { useConnectivityStore } from '@/stores/connectivity';

const MAX_ATTEMPTS = 5;
let syncing = false;

export async function drainSyncQueue(force = false): Promise<{ ok: number; failed: number }> {
  if (typeof navigator === 'undefined') return { ok: 0, failed: 0 };
  if (!navigator.onLine && !force) return { ok: 0, failed: 0 };
  if (syncing) return { ok: 0, failed: 0 };

  syncing = true;
  useConnectivityStore.getState().setSyncing(true);

  let ok = 0;
  let failed = 0;

  try {
    const pending = await offlineDb.sync_queue
      .where('status')
      .anyOf(['pending', 'failed'])
      .sortBy('createdAt');

    if (!pending.length) {
      return { ok: 0, failed: 0 };
    }

    const deviceId = await getDeviceId();
    const events = pending.map((e) => ({
      id: e.id,
      type: e.type,
      payload: e.payload,
      client_timestamp: e.createdAt,
    }));

    const { data } = await api.post('/sync/ingest', { device_id: deviceId, events });
    const results = (data.body?.results as Array<{
      id: string;
      ok: boolean;
      server_id?: string;
      reference_no?: string;
      error?: string;
    }>) || [];

    for (const result of results) {
      const row = pending.find((p) => p.id === result.id);
      if (!row) continue;

      if (result.ok) {
        await offlineDb.sync_queue.update(row.id, { status: 'synced' });
        ok += 1;

        if (row.type === 'order.checkout' || row.type === 'order.hold') {
          const clientOrderId = String(row.payload.client_order_id || '');
          const completed = await offlineDb.completed_orders.get(clientOrderId);
          if (completed) {
            await offlineDb.completed_orders.update(clientOrderId, {
              status: 'synced',
              serverOrderId: result.server_id,
              serverReferenceNo: result.reference_no,
            });
          }
          const held = await offlineDb.held_orders.get(clientOrderId);
          if (held) {
            await offlineDb.held_orders.update(clientOrderId, {
              synced: true,
              serverOrderId: result.server_id,
            });
          }
        }

        if (row.type === 'session.open') {
          const localId = String(row.payload.client_session_id || '');
          const session = await offlineDb.sessions.get(localId);
          if (session && result.server_id) {
            await offlineDb.sessions.update(localId, {
              synced: true,
              serverSessionId: result.server_id,
            });
          }
        }
      } else {
        failed += 1;
        const attempts = row.attempts + 1;
        await offlineDb.sync_queue.update(row.id, {
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          attempts,
          lastError: result.error || 'Sync failed',
        });
      }
    }

    const registerId = (await offlineDb.meta.get('device'))?.registerId;
    if (registerId && navigator.onLine) {
      try {
        await posOfflineClient.loadViewer(registerId);
      } catch {
        /* ignore refresh errors */
      }
    }
  } catch (err) {
    console.error('[sync]', err);
  } finally {
    syncing = false;
    useConnectivityStore.getState().setSyncing(false);
    useConnectivityStore.getState().refreshPending();
  }

  return { ok, failed };
}

export function startSyncEngine() {
  if (typeof window === 'undefined') return;

  const run = () => drainSyncQueue().catch(console.error);

  window.addEventListener('online', run);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });

  const interval = window.setInterval(() => {
    if (navigator.onLine) run();
  }, 30000);

  run();

  return () => {
    window.removeEventListener('online', run);
    window.clearInterval(interval);
  };
}
