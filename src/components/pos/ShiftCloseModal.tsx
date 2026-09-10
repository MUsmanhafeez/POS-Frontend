'use client';

import { FormEvent, useEffect, useState } from 'react';
import api from '@/lib/api';
import { btnPrimary, fieldClass } from '@/lib/ui';

type ShiftCloseModalProps = {
  open: boolean;
  sessionId: string | null;
  currency?: string;
  onClose: () => void;
  onClosed?: () => void;
};

export default function ShiftCloseModal({ open, sessionId, currency = 'PKR', onClose, onClosed }: ShiftCloseModalProps) {
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    expectedCash?: number;
    variance?: number;
    closingCash?: number;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setClosingCash('');
      setNotes('');
      setResult(null);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  async function closeShift(e: FormEvent) {
    e.preventDefault();
    if (!sessionId) {
      setError('No open session');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/pos/sessions/${sessionId}/close`, {
        closing_cash: Number(closingCash || 0),
        notes: notes || null,
      });
      const body = data.body || {};
      setResult({
        expectedCash: Number(body.expectedCash ?? body.expected_cash ?? 0),
        variance: Number(body.variance ?? 0),
        closingCash: Number(body.closingCash ?? body.closing_cash ?? closingCash),
      });
      onClosed?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to close session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Z Report — Close Shift</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {result ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between">
                <span>Counted cash</span>
                <span className="font-semibold">{currency} {result.closingCash?.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Expected cash</span>
                <span className="font-semibold">{currency} {result.expectedCash?.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span>Variance</span>
                <span
                  className={`font-bold ${(result.variance || 0) < 0 ? 'text-rose-600' : (result.variance || 0) > 0 ? 'text-emerald-600' : 'text-slate-700'}`}
                >
                  {currency} {result.variance?.toFixed(2)}
                </span>
              </div>
            </div>
            <button type="button" className={btnPrimary} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={closeShift} className="space-y-3">
            <p className="text-sm text-slate-600">Enter counted cash in drawer to complete Z report and close the session.</p>
            <label className="block text-sm font-medium text-slate-700">
              Counted cash ({currency})
              <input
                className={`${fieldClass} mt-1`}
                type="number"
                step="0.01"
                required
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Notes
              <textarea className={`${fieldClass} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <div className="flex gap-2">
              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={loading || !sessionId} className={btnPrimary}>
                {loading ? 'Closing…' : 'Close shift (Z)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
