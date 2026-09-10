'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import api from '@/lib/api';
import { Card, Field } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Combo = {
  id: string;
  name: unknown;
  price: number;
  items?: Array<{ included_product_id?: string; includedProductId?: string; qty: number; included_name?: unknown }>;
};

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: unknown; price: number }>>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [lines, setLines] = useState<Array<{ product_id: string; qty: string }>>([{ product_id: '', qty: '1' }]);

  async function load() {
    const [c, p] = await Promise.all([api.get('/combos'), api.get('/products')]);
    setCombos(c.data.body || []);
    setProducts(p.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const items = lines
      .filter((l) => l.product_id)
      .map((l) => ({ product_id: l.product_id, qty: Number(l.qty || 1) }));
    await api.post('/combos', {
      name: { en: name },
      price: Number(price),
      items,
    });
    setName('');
    setPrice('');
    setLines([{ product_id: '', qty: '1' }]);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-plum" />
        <div>
          <h1 className="text-xl font-bold">Combo builder</h1>
          <p className="text-sm text-muted">Bundle products into combo meals for POS.</p>
        </div>
      </div>

      <Card className="p-4">
        <form onSubmit={create} className="space-y-3 max-w-xl">
          <Field label="Combo name">
            <input className={fieldClass} required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Bundle price">
            <input className={fieldClass} required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Included items</div>
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <select className={fieldClass} value={line.product_id} onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], product_id: e.target.value };
                  setLines(next);
                }}>
                  <option value="">Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{labelOf(p.name)}</option>
                  ))}
                </select>
                <input className={`${fieldClass} w-20`} type="number" min={1} value={line.qty} onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], qty: e.target.value };
                  setLines(next);
                }} />
              </div>
            ))}
            <button type="button" className="text-sm text-brand" onClick={() => setLines([...lines, { product_id: '', qty: '1' }])}>
              + Add line
            </button>
          </div>
          <button type="submit" className={btnPrimary}>Create combo</button>
        </form>
      </Card>

      <Card className="divide-y divide-border">
        {combos.map((c) => (
          <div key={c.id} className="p-4">
            <div className="font-semibold">{labelOf(c.name)} · {Number(c.price).toFixed(2)}</div>
            <ul className="mt-2 text-sm text-muted">
              {(c.items || []).map((it, i) => (
                <li key={i}>{labelOf(it.included_name)} × {it.qty}</li>
              ))}
            </ul>
          </div>
        ))}
        {!combos.length ? <p className="p-6 text-center text-sm text-muted">No combos yet</p> : null}
      </Card>
    </div>
  );
}
