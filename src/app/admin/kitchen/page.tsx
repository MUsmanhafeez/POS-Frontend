'use client';

import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass } from '@/lib/ui';

type Ticket = {
  id: string;
  name: string;
  qty: number;
  order_code?: string;
  orderCode?: string;
  kitchen_status?: string;
  kitchenStatus?: string;
  age_minutes?: number;
  ageMinutes?: number;
  allergen_flags?: string[];
  special_instructions?: string;
  station?: string;
};

function ageColor(mins: number) {
  if (mins >= 15) return 'border-rose-400 bg-rose-50';
  if (mins >= 8) return 'border-amber-400 bg-amber-50';
  return 'border-emerald-400 bg-emerald-50';
}

export default function KitchenPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [station, setStation] = useState('');

  async function refresh() {
    const { data } = await api.get('/kitchen/tickets', { params: station ? { station } : {} });
    setTickets(data.body || []);
  }

  useEffect(() => {
    refresh().catch(console.error);
    const t = setInterval(() => refresh().catch(console.error), 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station]);

  async function bump(id: string, status: string) {
    await api.post(`/kitchen/tickets/${id}/bump`, { status });
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
        </div>
        <div className="flex gap-2">
          <select className={`${fieldClass} bg-slate-900 text-white`} value={station} onChange={(e) => setStation(e.target.value)}>
            <option value="">All stations</option>
            <option value="grill">Grill</option>
            <option value="fry">Fry</option>
            <option value="dessert">Dessert</option>
            <option value="bar">Bar</option>
          </select>
          <button type="button" className={btnPrimary} onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tickets.map((t) => {
          const age = t.age_minutes ?? t.ageMinutes ?? 0;
          const allergens = t.allergen_flags || [];
          return (
            <Card key={t.id} className={`border-2 p-4 text-slate-900 ${ageColor(age)}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">Order {t.order_code || t.orderCode}</div>
                  <div className="text-xl font-bold">
                    {t.qty}× {t.name}
                  </div>
                </div>
                <div className="rounded-full bg-white/80 px-2 py-1 text-xs font-bold">{age}m</div>
              </div>
              {t.special_instructions ? <p className="mt-2 text-sm italic text-slate-700">{t.special_instructions}</p> : null}
              {allergens.length ? (
                <div className="mt-2 rounded-lg bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900">
                  Allergens: {allergens.join(', ')}
                </div>
              ) : null}
              <div className="mt-4 flex gap-2">
                <button type="button" className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white" onClick={() => bump(t.id, 'in-prep')}>
                  Prep
                </button>
                <button type="button" className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white" onClick={() => bump(t.id, 'ready')}>
                  Bump
                </button>
              </div>
            </Card>
          );
        })}
        {!tickets.length ? <p className="text-slate-400">No active tickets</p> : null}
      </div>
    </div>
  );
}
