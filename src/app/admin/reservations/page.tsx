'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import api from '@/lib/api';
import { Card, Field } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Reservation = {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  party_size?: number;
  reserved_at?: string;
  status?: string;
  table_id?: string;
  notes?: string;
};

export default function ReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Array<{ id: string; name: unknown }>>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [tableId, setTableId] = useState('');
  const [reservedAt, setReservedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');

  async function load() {
    const [res, tbl] = await Promise.all([api.get('/reservations'), api.get('/tables')]);
    setRows(res.data.body || []);
    setTables(tbl.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api.post('/reservations', {
      customer_name: name,
      customer_phone: phone || null,
      customer_email: email || null,
      party_size: Number(partySize),
      table_id: tableId || null,
      reserved_at: reservedAt,
      notes: notes || null,
    });
    setName('');
    setPhone('');
    setNotes('');
    await load();
  }

  async function cancel(id: string) {
    await api.post(`/reservations/${id}/cancel`);
    await load();
  }

  async function assignTable(id: string, newTableId: string) {
    await api.patch(`/reservations/${id}`, { table_id: newTableId });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-plum" />
        <div>
          <h1 className="text-xl font-bold">Reservations</h1>
          <p className="text-sm text-muted">Book, cancel, and assign tables for upcoming guests.</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold">New reservation</h2>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Guest name">
            <input className={fieldClass} required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Email (confirmation)">
            <input type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
          </Field>
          <Field label="Party size">
            <input className={fieldClass} type="number" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
          </Field>
          <Field label="Table">
            <select className={fieldClass} value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">No table yet</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{labelOf(t.name)}</option>
              ))}
            </select>
          </Field>
          <Field label="Reserved at">
            <input className={fieldClass} type="datetime-local" value={reservedAt} onChange={(e) => setReservedAt(e.target.value)} />
          </Field>
          <Field label="Notes">
            <input className={fieldClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className={btnPrimary}>Book reservation</button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-surface-muted/50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.customer_name}</div>
                  <div className="text-xs text-muted">{r.customer_phone || '—'}</div>
                </td>
                <td className="px-4 py-3">{r.reserved_at ? new Date(r.reserved_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">{r.party_size ?? '—'}</td>
                <td className="px-4 py-3">{r.status || 'booked'}</td>
                <td className="px-4 py-3">
                  <select
                    className={`${fieldClass} py-1 text-xs`}
                    value={r.table_id || ''}
                    onChange={(e) => assignTable(r.id, e.target.value)}
                  >
                    <option value="">Assign…</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>{labelOf(t.name)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {r.status !== 'cancelled' ? (
                    <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => cancel(r.id)}>
                      Cancel
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-6 text-center text-sm text-muted">No reservations</p> : null}
      </Card>

      <Link href="/admin/tables" className="text-sm text-brand hover:underline">Back to seating plan</Link>
    </div>
  );
}
