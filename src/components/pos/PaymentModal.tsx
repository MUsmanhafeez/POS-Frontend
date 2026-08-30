'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export type PaymentLine = { method: string; amount: number; reference_no?: string };

export type PaymentBreakdown = {
  subtotal?: number;
  discountTotal?: number;
  loyaltyRedeemed?: number;
  taxTotal?: number;
  serviceCharge?: number;
};

export type PaymentModalProps = {
  open: boolean;
  total: number;
  currency?: string;
  quickPayAmounts?: number[];
  paymentMethods?: string[];
  breakdown?: PaymentBreakdown;
  customerEmail?: string | null;
  onClose: () => void;
  onConfirm: (payments: PaymentLine[], tipAmount: number, sendReceipt: boolean) => void;
};

const DEFAULT_METHODS = ['cash', 'card', 'wallet'];

function money(n: number, currency = 'PKR') {
  const decimals = currency === 'JOD' ? 3 : 2;
  return `${currency} ${Number(n || 0).toFixed(decimals)}`;
}

export default function PaymentModal({
  open,
  total,
  currency = 'PKR',
  quickPayAmounts = [],
  paymentMethods = DEFAULT_METHODS,
  breakdown,
  customerEmail,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [lines, setLines] = useState<PaymentLine[]>([{ method: 'cash', amount: total }]);
  const [tip, setTip] = useState('');
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);

  const tipAmount = Number(tip || 0);
  const grandTotal = total + tipAmount;
  const paid = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const remaining = Math.max(0, grandTotal - paid);
  const changeDue = paid > grandTotal ? paid - grandTotal : 0;

  const loyaltyValue = Number(breakdown?.loyaltyRedeemed || 0);
  const discountExLoyalty = Math.max(0, Number(breakdown?.discountTotal || 0) - loyaltyValue);

  useEffect(() => {
    if (open) {
      setLines([{ method: 'cash', amount: total }]);
      setTip('');
      setAmount(String(total));
      setMethod('cash');
      setSendReceipt(Boolean(customerEmail));
    }
  }, [open, total, customerEmail]);

  const methods = useMemo(
    () => paymentMethods.length ? paymentMethods : DEFAULT_METHODS,
    [paymentMethods]
  );

  if (!open) return null;

  function addLine() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setLines((prev) => [...prev, { method, amount: amt }]);
    setAmount(String(Math.max(0, remaining - amt)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleConfirm() {
    if (paid < grandTotal) return;
    onConfirm(lines, tipAmount, sendReceipt);
    onClose();
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="fixed left-1/2 top-1/2 z-[110] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Payment</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {breakdown && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span>{money(breakdown.subtotal || 0, currency)}</span>
              </div>
              {discountExLoyalty > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Discount</span>
                  <span>-{money(discountExLoyalty, currency)}</span>
                </div>
              )}
              {loyaltyValue > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Loyalty redeemed ({loyaltyValue} pts)</span>
                  <span>-{money(loyaltyValue, currency)}</span>
                </div>
              )}
              {Number(breakdown.taxTotal || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Tax</span>
                  <span>{money(breakdown.taxTotal || 0, currency)}</span>
                </div>
              )}
              {Number(breakdown.serviceCharge || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Service charge</span>
                  <span>{money(breakdown.serviceCharge || 0, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                <span>Total</span>
                <span>{money(total, currency)}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-orange-50 p-4 text-center">
            <div className="text-sm font-semibold text-orange-800">Amount due</div>
            <div className="text-2xl font-extrabold text-orange-900">{money(grandTotal, currency)}</div>
            {tipAmount > 0 && <div className="text-xs text-orange-700">Includes tip {money(tipAmount, currency)}</div>}
          </div>

          {customerEmail && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sendReceipt}
                onChange={(e) => setSendReceipt(e.target.checked)}
                className="rounded border-slate-300"
              />
              Email receipt to {customerEmail}
            </label>
          )}

          <label className="block text-xs font-bold text-slate-700">
            Tip
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="0"
            />
          </label>

          {quickPayAmounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickPayAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800"
                  onClick={() => setAmount(String(q))}
                >
                  {money(q, currency)}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-xl border py-2 text-sm font-bold capitalize ${
                  method === m ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="button" onClick={addLine} className="rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-800">
              Add tender
            </button>
          </div>

          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="capitalize font-semibold">{l.method}</span>
                <span className="flex items-center gap-2">
                  <span className="font-bold">{money(l.amount, currency)}</span>
                  <button type="button" className="text-rose-600 text-xs font-bold" onClick={() => removeLine(i)}>
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-medium text-slate-700">
              <span>Remaining</span>
              <span className="font-bold">{money(remaining, currency)}</span>
            </div>
            {changeDue > 0 && (
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Change due</span>
                <span>{money(changeDue, currency)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            disabled={paid < grandTotal}
            onClick={handleConfirm}
            className="btn-solid rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold !text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Complete payment
          </button>
        </div>
      </div>
    </>
  );
}
