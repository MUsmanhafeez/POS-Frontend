'use client';

import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { labelOf } from '@/lib/ui';

type PaymentRow = {
  id: string;
  order_no?: string;
  branch?: unknown;
  cashier?: string;
  method?: string;
  amount?: number;
  created_at?: string;
};

export default function PaymentsPage() {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/sales/payments', { params: { search } })
      .then((r) => setItems(r.data.body || []))
      .catch(console.error);
  }, [search]);

  return (
    <AdminListShell
      title="Payments"
      icon={
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-plum text-white">
          <DollarSign className="h-4 w-4" />
        </span>
      }
      search={search}
      onSearch={setSearch}
    >
      <AdminPagedTable
        rows={items}
        emptyTitle="No data available"
        columns={[
          { key: 'order', header: 'Order No', render: (r) => <span className="font-medium">{r.order_no || '—'}</span> },
          { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
          { key: 'cashier', header: 'Cashier', render: (r) => r.cashier || '—' },
          { key: 'method', header: 'Method', render: (r) => r.method || '—' },
          { key: 'amount', header: 'Amount', render: (r) => `JOD ${Number(r.amount || 0).toFixed(3)}` },
          {
            key: 'created',
            header: 'Created at',
            render: (r) => String(r.created_at || '—').replace('T', ' ').slice(0, 19),
          },
        ]}
      />
    </AdminListShell>
  );
}
