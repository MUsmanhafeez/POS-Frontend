'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '@/lib/api';
import { ActionsMenu, AdminListShell, AdminPagedTable, StatusBadge } from '@/components/admin/AdminListShell';
import { labelOf } from '@/lib/ui';

type InvoiceRow = {
  id: string;
  invoice_no?: string;
  branch?: unknown;
  seller?: string;
  buyer?: string;
  type?: string;
  status?: string;
  purpose?: string;
  kind?: string;
  total?: number;
  issued_at?: string;
};

export default function InvoicesPage() {
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/sales/invoices', { params: { search } })
      .then((r) => setItems(r.data.body || []))
      .catch(console.error);
  }, [search]);

  return (
    <AdminListShell
      title="Invoices"
      icon={<FileText className="h-5 w-5 text-plum" />}
      search={search}
      onSearch={setSearch}
    >
      <AdminPagedTable
        rows={items}
        emptyTitle="No data available"
        columns={[
          { key: 'no', header: 'Invoice No', render: (r) => <span className="font-medium">{r.invoice_no || '—'}</span> },
          { key: 'branch', header: 'Branch', render: (r) => labelOf(r.branch) || '—' },
          { key: 'seller', header: 'Seller', render: (r) => r.seller || '—' },
          { key: 'buyer', header: 'Buyer', render: (r) => r.buyer || '—' },
          { key: 'type', header: 'Type', render: (r) => r.type || '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          { key: 'purpose', header: 'Purpose', render: (r) => r.purpose || '—' },
          { key: 'kind', header: 'Kind', render: (r) => r.kind || '—' },
          { key: 'total', header: 'Total', render: (r) => `JOD ${Number(r.total || 0).toFixed(3)}` },
          {
            key: 'issued',
            header: 'Issued At',
            render: (r) => String(r.issued_at || '—').replace('T', ' ').slice(0, 19),
          },
          { key: 'actions', header: 'Actions', render: () => <ActionsMenu /> },
        ]}
      />
    </AdminListShell>
  );
}
