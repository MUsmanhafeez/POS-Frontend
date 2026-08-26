'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lock, Printer } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

const DENOMS = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

type Branch = { id: string; name: unknown };
type Register = { id: string; name: unknown; code?: string; branchId?: string };
type Shift = { id: string; name: string; code?: string };
type Session = { id: string; status?: string; openingFloat?: number; openedAt?: string };

export default function OpeningClosingPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>(() =>
    Object.fromEntries(DENOMS.map((d) => [d, '']))
  );
  const [branchId, setBranchId] = useState('');
  const [registerId, setRegisterId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [txDate, setTxDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const total = useMemo(
    () => DENOMS.reduce((sum, d) => sum + d * Number(counts[d] || 0), 0),
    [counts]
  );

  const filteredRegisters = useMemo(
    () => (branchId ? registers.filter((r) => !r.branchId || r.branchId === branchId) : registers),
    [registers, branchId]
  );

  async function loadLookups() {
    const [b, r, s] = await Promise.all([
      api.get('/branches'),
      api.get('/pos/registers'),
      api.get('/shifts'),
    ]);
    setBranches(b.data.body || []);
    setRegisters(r.data.body || []);
    setShifts(s.data.body || []);
    if (!branchId && b.data.body?.[0]?.id) setBranchId(b.data.body[0].id);
    if (!registerId && r.data.body?.[0]?.id) setRegisterId(r.data.body[0].id);
    if (!shiftId && s.data.body?.[0]?.id) setShiftId(s.data.body[0].id);
  }

  async function loadOpenSession(regId: string) {
    if (!regId) {
      setSession(null);
      return;
    }
    const { data } = await api.get('/pos/sessions', {
      params: { pos_register_id: regId, status: 'open' },
    });
    const open = (data.body || [])[0] || null;
    setSession(open);
  }

  useEffect(() => {
    loadLookups().catch(console.error);
  }, []);

  useEffect(() => {
    loadOpenSession(registerId).catch(console.error);
  }, [registerId]);

  async function openSession() {
    if (!registerId) {
      setMessage('Select a till / register first');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await api.post('/pos/sessions/open', {
        pos_register_id: registerId,
        opening_float: total,
        shift_id: shiftId || null,
      });
      setCounts(Object.fromEntries(DENOMS.map((d) => [d, ''])));
      await loadOpenSession(registerId);
      setMessage('Session opened');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage(e.response?.data?.message || 'Failed to open session');
    } finally {
      setBusy(false);
    }
  }

  async function closeSession() {
    if (!session?.id) {
      setMessage('NO OPEN SESSION');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await api.post(`/pos/sessions/${session.id}/close`, {
        closing_cash: total,
        notes: `Cash count total: ${total}`,
      });
      setCounts(Object.fromEntries(DENOMS.map((d) => [d, ''])));
      setSession(null);
      setMessage('Session closed');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage(e.response?.data?.message || 'Failed to close session');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Opening & Closing</h1>
        </div>
        <div className="text-sm text-muted">Home &gt; Opening & Closing</div>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lock className="h-4 w-4 text-plum" /> Opening & Closing
          </h2>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted" disabled>
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-foreground">CASH COUNT</h3>
            <div className="space-y-2">
              {DENOMS.map((d) => {
                const qty = Number(counts[d] || 0);
                const line = d * qty;
                return (
                  <div key={d} className="grid grid-cols-[100px_1fr_64px] items-center gap-3">
                    <span className="text-sm font-medium text-foreground">RS: {d.toLocaleString()}</span>
                    <input
                      className={fieldClass}
                      type="number"
                      min={0}
                      value={counts[d]}
                      onChange={(e) => setCounts((c) => ({ ...c, [d]: e.target.value }))}
                    />
                    <span className="text-right text-sm text-muted">{line || 0}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide">POS DETAILS</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Branch</label>
                  <select className={fieldClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{labelOf(b.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Till No.</label>
                  <select className={fieldClass} value={registerId} onChange={(e) => setRegisterId(e.target.value)}>
                    <option value="">Select till</option>
                    {filteredRegisters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {labelOf(r.name)} {r.code ? `(${r.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Transaction Date</label>
                  <input className={fieldClass} value={txDate} onChange={(e) => setTxDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Shift Info</label>
                  <select className={fieldClass} value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
                    <option value="">Select shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.code ? ` (${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide">DAY OPENING AND CLOSING</h3>
              <div className="space-y-3">
                <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={busy} onClick={openSession}>
                  Open Session
                </button>
                <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={busy} onClick={closeSession}>
                  Close Session
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide">TRANSACTION INFO</h3>
              <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-border bg-surface-muted px-4 py-6 text-center">
                {session ? (
                  <div className="text-sm">
                    <div className="font-bold text-plum">OPEN SESSION</div>
                    <div className="mt-1 text-muted">
                      Float: {Number(session.openingFloat || 0).toLocaleString()}
                    </div>
                    <div className="text-muted">
                      Since: {String(session.openedAt || '').replace('T', ' ').slice(0, 19)}
                    </div>
                  </div>
                ) : (
                  <span className="font-bold tracking-wide text-foreground">NO OPEN SESSION</span>
                )}
              </div>
              {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
