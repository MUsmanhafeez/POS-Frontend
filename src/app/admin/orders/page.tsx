'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingBasket } from 'lucide-react';
import api from '@/lib/api';
import { AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import ManagerPinModal from '@/components/admin/ManagerPinModal';
import { labelOf } from '@/lib/ui';

type OrderRow = {
  id: string;
  customer?: string;
  reference_no?: string;
  referenceNo?: string;
  branch?: unknown;
  type?: string;
  status?: string;
  payment_status?: string;
  paymentStatus?: string;
  total?: number;
  created_at?: string;
  createdAt?: string;
};

export default function OrdersPage() {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [search, setSearch] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [pending, setPending] = useState<{ id: string; action: 'void' | 'refund'; amount?: number } | null>(null);

  async function load() {
    const r = await api.get('/sales/orders', { params: { search } });
    setItems(r.data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const rows = useMemo(() => items, [items]);

  return (
    <>
      <AdminListShell title="Orders" icon={<ShoppingBasket className="h-5 w-5 text-plum" />} search={search} onSearch={setSearch}>
        <AdminPagedTable
          rows={rows}
          emptyTitle="No data available"
          columns={[
            { key: 'customer', header: 'Customer', render: (r) => r.customer || 'Walk-in' },
            { key: 'ref', header: 'Reference No', render: (r) => <span className="font-medium">{r.reference_no || r.referenceNo || '—'}</span> },
            { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
            { key: 'type', header: 'Type', render: (r) => r.type || '—' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            {
              key: 'payment',
              header: 'Payment Status',
              render: (r) => <StatusBadge value={r.payment_status || r.paymentStatus} />,
            },
            { key: 'total', header: 'Total', render: (r) => `PKR ${Number(r.total || 0).toFixed(2)}` },
            {
              key: 'created',
              header: 'Created at',
              render: (r) => String(r.created_at || r.createdAt || '—').replace('T', ' ').slice(0, 19),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="text-rose-600"
                    onClick={() => {
                      setPending({ id: r.id, action: 'void' });
                      setPinOpen(true);
                    }}
                  >
                    Void
                  </button>
                  <button
                    type="button"
                    className="text-amber-600"
                    onClick={() => {
                      setPending({ id: r.id, action: 'refund', amount: Number(r.total || 0) });
                      setPinOpen(true);
                    }}
                  >
                    Refund
                  </button>
                </div>
              ),
            },
          ]}
        />
      </AdminListShell>

      <ManagerPinModal
        open={pinOpen}
        onClose={() => {
          setPinOpen(false);
          setPending(null);
        }}
        onVerified={async (approver) => {
          if (!pending) return;
          if (pending.action === 'void') {
            await api.post(`/orders/${pending.id}/void`, { reason: 'Manager void', approved_by: approver.id });
          } else {
            await api.post(`/orders/${pending.id}/refund`, {
              reason: 'Manager refund',
              amount: pending.amount || 0,
              approved_by: approver.id,
            });
          }
          await load();
        }}
      />
    </>
  );
}
