'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { labelOf } from '@/lib/ui';

export type ProductOption = {
  id: string;
  name: unknown;
  isRequired?: boolean;
  is_required?: boolean;
  maxSelections?: number;
  max_selections?: number;
  values: Array<{ name: string; price?: number }>;
};

export type ModifierModalProps = {
  open: boolean;
  productName: unknown;
  options: ProductOption[];
  onClose: () => void;
  onConfirm: (selected: Array<{ name: string; group: string; price: number }>, notes: string, course: string) => void;
};

const COURSES = [
  { id: '', label: 'No course' },
  { id: 'starter', label: 'Starter' },
  { id: 'main', label: 'Main' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'drink', label: 'Drink' },
];

export default function ModifierModal({ open, productName, options, onClose, onConfirm }: ModifierModalProps) {
  const [notes, setNotes] = useState('');
  const [course, setCourse] = useState('');
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  if (!open) return null;

  function toggle(groupId: string, valueName: string, max: number) {
    setSelected((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(valueName)) {
        return { ...prev, [groupId]: current.filter((v) => v !== valueName) };
      }
      if (max <= 1) return { ...prev, [groupId]: [valueName] };
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, valueName] };
    });
  }

  function handleConfirm() {
    const out: Array<{ name: string; group: string; price: number }> = [];
    for (const opt of options) {
      const groupName = labelOf(opt.name);
      const picks = selected[opt.id] || [];
      for (const pick of picks) {
        const val = opt.values.find((v) => v.name === pick);
        out.push({ name: pick, group: groupName, price: Number(val?.price || 0) });
      }
      const required = opt.isRequired ?? opt.is_required;
      if (required && picks.length === 0) {
        return;
      }
    }
    onConfirm(out, notes, course);
    setNotes('');
    setCourse('');
    setSelected({});
    onClose();
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="fixed left-1/2 top-1/2 z-[110] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{labelOf(productName)}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          {options.map((opt) => {
            const max = Number(opt.maxSelections ?? opt.max_selections ?? 1);
            const required = opt.isRequired ?? opt.is_required;
            return (
              <div key={opt.id}>
                <div className="text-sm font-bold text-slate-800">
                  {labelOf(opt.name)}
                  {required ? <span className="text-rose-600"> *</span> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {opt.values.map((v) => {
                    const active = (selected[opt.id] || []).includes(v.name);
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => toggle(opt.id, v.name, max)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          active ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {v.name}
                        {v.price ? ` (+${v.price})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <label className="block text-sm font-bold text-slate-700">
            Course
            <select
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {COURSES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Special instructions
            <input
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="No onion, extra spicy…"
            />
          </label>
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
            Add to order
          </button>
        </div>
      </div>
    </>
  );
}
