'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import PaymentModal, { type PaymentLine } from '@/components/pos/PaymentModal';

export type SplitBillModalProps = {
  open: boolean;
  orderId: string;
  orderRef?: string;
  total: number;
  currency?: string;
  onClose: () => void;
  onDone?: () => void;
};

export default function SplitBillModal({
  open,
  orderId,
  orderRef,
  total,
  currency = 'PKR',
  onClose,
  onDone,
}: SplitBillModalProps) {
  const [parts, setParts] = useState('2');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [subTotals, setSubTotals] = useState<number[]>([]);
  const [splitId, setSplitId] = useState<string | null>(null);
  const [payIndex, setPayIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!open) return null;

  async function createSplit() {
    setBusy(true);
    setMessage('');
    try {
      const n = Math.max(2, Number(parts) || 2);
      const payload =
        splitType === 'equal'
          ? { split_type: 'equal', parts: n }
          : { split_type: 'custom', sub_totals: subTotals.length ? subTotals : [total] };
      const { data } = await api.post(`/orders/${orderId}/split`, payload);
      const splits = (data.body.sub_totals as number[]) || [];
      setSubTotals(splits);
      setSplitId(data.body.id as string);
      setMessage(`Split into ${splits.length} parts`);
    } catch (err: unknown) {
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Split failed');
    } finally {
      setBusy(false);
    }
  }

  async function paySplit(payments: PaymentLine[]) {
    if (payIndex === null) return;
    const amount = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const method = payments[0]?.method || 'cash';
    await api.post(`/orders/${orderId}/split/pay`, {
      split_index: payIndex,
      amount,
      method,
    });
    setPayIndex(null);
    setMessage(`Split ${payIndex + 1} paid`);
    onDone?.();
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="fixed left-1/2 top-1/2 z-[110] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Split bill</h2>
            {orderRef ? <p className="text-xs text-slate-500">{orderRef}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {!splitId ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(['equal', 'custom'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSplitType(t)}
                    className={`rounded-xl border py-2 text-sm font-bold capitalize ${
                      splitType === t ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t === 'equal' ? 'Equal split' : 'By amount'}
                  </button>
                ))}
              </div>
              {splitType === 'equal' ? (
                <label className="block text-xs font-bold text-slate-700">
                  Number of splits
                  <input
                    type="number"
                    min={2}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    value={parts}
                    onChange={(e) => setParts(e.target.value)}
                  />
                </label>
              ) : (
                <p className="text-sm text-slate-600">Full amount: {currency} {total.toFixed(2)}</p>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={createSplit}
                className="btn-solid w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold !text-white disabled:opacity-50"
              >
                Create split
              </button>
            </>
          ) : (
            <ul className="space-y-2">
              {subTotals.map((amt, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                  <span className="font-semibold">Guest {i + 1}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{currency} {amt.toFixed(2)}</span>
                    <button
                      type="button"
                      className="rounded-lg bg-orange-500 px-2 py-1 text-xs font-bold text-white"
                      onClick={() => setPayIndex(i)}
                    >
                      Pay
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {message ? <p className="text-sm font-semibold text-teal-700">{message}</p> : null}
        </div>
      </div>
      {payIndex !== null && (
        <PaymentModal
          open
          total={subTotals[payIndex] || 0}
          currency={currency}
          onClose={() => setPayIndex(null)}
          onConfirm={(payments) => paySplit(payments)}
        />
      )}
    </>
  );
}
