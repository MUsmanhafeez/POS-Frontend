'use client';

import { FormEvent, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

export default function ProductIngredientsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [productId, setProductId] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [qty, setQty] = useState(1);

  async function load() {
    const { data } = await api.get('/product-ingredients');
    setRows(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/product-ingredients', {
      product_id: productId,
      ingredient_id: ingredientId,
      qty_per_unit: qty,
    });
    setProductId('');
    setIngredientId('');
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Product ↔ Ingredient mapping</h1>
      <Card className="p-4">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-4">
          <input className={fieldClass} placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} required />
          <input className={fieldClass} placeholder="Ingredient ID" value={ingredientId} onChange={(e) => setIngredientId(e.target.value)} required />
          <input type="number" className={fieldClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <button type="submit" className={btnPrimary}>Add mapping</button>
        </form>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Ingredient</th>
              <th className="p-3">Qty/unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t border-border">
                <td className="p-3">{String(r.product_name || r.product_id)}</td>
                <td className="p-3">{String(r.ingredient_name || r.ingredient_id)}</td>
                <td className="p-3">{Number(r.qty_per_unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
