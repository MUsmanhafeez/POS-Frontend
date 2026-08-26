'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';
import { btnSecondary, labelOf } from '@/lib/ui';

export default function PosIndexPage() {
  const [registers, setRegisters] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.get('/pos/registers').then((res) => setRegisters(res.data.body || [])).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader
        title="POS Registers"
        description="Choose a register to open the live POS screen."
        action={
          <Link href="/admin/registers" className={btnSecondary}>
            Manage registers
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {registers.map((r) => (
          <Link key={String(r.id)} href={`/admin/pos/${r.id}`}>
            <Card className="h-full p-5 transition hover:border-brand hover:shadow-md">
              <div className="text-lg font-semibold text-foreground">{labelOf(r.name)}</div>
              <div className="mt-1 text-sm text-muted">Code: {String(r.code)}</div>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand">
                {r.isFloorRegister ? 'Floor / Order Taker' : 'Cashier Register'}
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
        ))}
        {!registers.length && (
          <Card className="p-8 text-center text-sm text-muted sm:col-span-2 xl:col-span-3">
            No registers found. <Link href="/admin/registers" className="font-medium text-brand">Create one</Link>
          </Card>
        )}
      </div>
    </div>
  );
}
