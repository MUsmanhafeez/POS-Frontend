'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Product = { id: string; name: unknown; price: number; allergen_flags?: string[] };
type CartLine = { product_id: string; name: string; price: number; qty: number };

export default function QrOrderPage() {
  const params = useParams();
  const branchId = String(params.branchId || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState<number | null>(null);
  const [kiosk, setKiosk] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    api.get(`/public/branches/${branchId}/menu`).then((res) => setProducts(res.data.body || [])).catch(console.error);
  }, [branchId]);

  function add(p: Product) {
    setCart((prev) => {
      const existing = prev.find((x) => x.product_id === p.id);
      if (existing) return prev.map((x) => (x.product_id === p.id ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { product_id: p.id, name: labelOf(p.name), price: Number(p.price), qty: 1 }];
    });
  }

  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);

  async function place() {
    const { data } = await api.post(`/public/branches/${branchId}/orders`, {
      customer_name: name || 'Guest',
      customer_phone: phone || null,
      items: cart,
    });
    setToken(data.body.token_number);
    setCart([]);
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-emerald-50 to-white ${kiosk ? 'text-lg' : ''}`}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-[0.2em] text-emerald-700">FORKIVA</div>
            <h1 className="text-2xl font-bold text-slate-900">{kiosk ? 'Kiosk Order' : 'QR Order'}</h1>
          </div>
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={() => setKiosk((v) => !v)}>
            {kiosk ? 'Standard view' : 'Kiosk mode'}
          </button>
        </div>

        {token != null ? (
          <div className="rounded-3xl bg-emerald-600 p-10 text-center text-white">
            <div className="text-sm uppercase tracking-wide opacity-80">Your token</div>
            <div className="mt-2 text-6xl font-bold">#{token}</div>
            <p className="mt-4 text-emerald-50">Please wait until your number is called.</p>
            <button type="button" className="mt-6 rounded-xl bg-white px-4 py-2 font-semibold text-emerald-700" onClick={() => setToken(null)}>
              Order more
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400"
                >
                  <div className={`font-semibold text-slate-900 ${kiosk ? 'text-xl' : ''}`}>{labelOf(p.name)}</div>
                  <div className="mt-1 text-emerald-700">{Number(p.price).toFixed(2)}</div>
                  {p.allergen_flags?.length ? (
                    <div className="mt-2 text-xs text-amber-700">Allergens: {p.allergen_flags.join(', ')}</div>
                  ) : null}
                </button>
              ))}
              {!products.length ? <p className="text-slate-500">Menu unavailable</p> : null}
            </div>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold">Your order</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {cart.map((l) => (
                  <li key={l.product_id} className="flex justify-between gap-2">
                    <span>
                      {l.qty}× {l.name}
                    </span>
                    <span>{(l.qty * l.price).toFixed(2)}</span>
                  </li>
                ))}
                {!cart.length ? <li className="text-slate-400">Tap items to add</li> : null}
              </ul>
              <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
              <input className={`${fieldClass} mt-3`} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={`${fieldClass} mt-2`} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <button type="button" className={`${btnPrimary} mt-3 w-full`} disabled={!cart.length} onClick={place}>
                Place order
              </button>
              <button type="button" className="mt-2 w-full text-sm text-slate-500 underline">
                Call for help
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
