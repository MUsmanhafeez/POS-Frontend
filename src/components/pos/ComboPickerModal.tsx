'use client';

import { X } from 'lucide-react';
import { labelOf } from '@/lib/ui';

export type ComboItem = {
  includedProductId?: string;
  included_product_id?: string;
  qty?: number;
  includedName?: unknown;
  included_name?: unknown;
};

export type ComboPickerModalProps = {
  open: boolean;
  productName: unknown;
  comboPrice: number;
  currency?: string;
  items: ComboItem[];
  onClose: () => void;
  onConfirm: (notes: string) => void;
};

function money(n: number, currency = 'PKR') {
  const decimals = currency === 'JOD' ? 3 : 2;
  return `${currency} ${Number(n || 0).toFixed(decimals)}`;
}

export default function ComboPickerModal({
  open,
  productName,
  comboPrice,
  currency = 'PKR',
  items,
  onClose,
  onConfirm,
}: ComboPickerModalProps) {
  if (!open) return null;

  const lines = items.map((item) => {
    const name = labelOf(item.includedName ?? item.included_name);
    const qty = Number(item.qty || 1);
    return `${qty}x ${name}`;
  });

  function handleConfirm() {
    const notes = lines.length ? `Combo includes: ${lines.join(', ')}` : '';
    onConfirm(notes);
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="fixed left-1/2 top-1/2 z-[110] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{labelOf(productName)}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-600">This combo bundle includes:</p>
          <ul className="space-y-1 text-sm">
            {items.map((item, i) => (
              <li key={i} className="flex justify-between rounded-lg border px-3 py-2">
                <span>{labelOf(item.includedName ?? item.included_name)}</span>
                <span className="font-semibold text-slate-700">×{Number(item.qty || 1)}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-teal-50 p-3 text-center font-bold text-teal-800">
            Combo price: {money(comboPrice, currency)}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-solid rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold !text-white hover:bg-teal-700"
          >
            Add combo
          </button>
        </div>
      </div>
    </>
  );
}
