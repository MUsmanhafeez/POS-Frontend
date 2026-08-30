'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Product = { id: string; name: unknown; price: number; allergen_flags?: string[] };
type CartLine = { product_id: string; name: string; price: number; qty: number };

export default function QrOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = String(params.branchId || '');
  const tableId = searchParams.get('table_id') || searchParams.get('table') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState<number | null>(null);
  const [kiosk, setKiosk] = useState(searchParams.get('kiosk') === '1');

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
      table_id: tableId || null,
      type: tableId ? 'dine_in' : 'takeaway',
      order_source: kiosk ? 'kiosk' : 'qr',
      kiosk,
      items: cart,
    });
    setToken(data.body.token_number);
    setCart([]);
  }

  const touch = kiosk ? 'text-lg' : '';
  const btnSize = kiosk ? 'min-h-[3rem] text-lg' : '';

  return (
    <div className={`min-h-screen bg-gradient-to-b from-emerald-50 to-white ${touch}`}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-[0.2em] text-emerald-700">FORKIVA</div>
            <h1 className={`font-bold text-slate-900 ${kiosk ? 'text-3xl' : 'text-2xl'}`}>
              {kiosk ? 'Kiosk Order' : tableId ? 'Table ordering' : 'QR Order'}
            </h1>
            {tableId ? <p className="text-sm text-emerald-800">Table linked · dine-in</p> : null}
          </div>
          <button type="button" className={`rounded-xl border px-3 py-2 text-sm ${btnSize}`} onClick={() => setKiosk((v) => !v)}>
            {kiosk ? 'Standard view' : 'Kiosk mode'}
          </button>
        </div>

        {token != null ? (
          <div className="rounded-3xl bg-emerald-600 p-10 text-center text-white">
            <div className="text-sm uppercase tracking-wide opacity-80">Your token</div>
            <div className={`mt-2 font-bold ${kiosk ? 'text-8xl' : 'text-6xl'}`}>#{token}</div>
            <p className="mt-4 text-emerald-50">Please wait until your number is called.</p>
            <button type="button" className="mt-6 rounded-xl bg-white px-4 py-2 font-semibold text-emerald-700" onClick={() => setToken(null)}>
              Order more
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className={`grid gap-3 ${kiosk ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p)}
                  className={`rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400 ${kiosk ? 'p-6' : ''}`}
                >
                  <div className={`font-semibold text-slate-900 ${kiosk ? 'text-xl' : ''}`}>{labelOf(p.name)}</div>
                  <div className="mt-1 text-emerald-700">{Number(p.price).toFixed(2)}</div>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-bold text-slate-900">Your order</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {cart.map((l) => (
                  <li key={l.product_id} className="flex justify-between gap-2">
                    <span>{l.name} × {l.qty}</span>
                    <span>{(l.price * l.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
              <input className={`${fieldClass} mt-4`} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={`${fieldClass} mt-2`} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <button
                type="button"
                disabled={!cart.length}
                className={`${btnPrimary} mt-4 w-full ${btnSize}`}
                onClick={place}
              >
                Place order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
