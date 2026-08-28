'use client';

import { useEffect, useState } from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { LOCALIZATION_TABS } from '@/lib/nav';
import { AdminListShell, AdminPagedTable } from '@/components/admin/AdminListShell';
import { btnPrimary } from '@/lib/ui';
import { formatLogDate } from '@/components/admin/LogCells';

type Row = {
  id: string;
  currencyName?: string;
  currency_name?: string;
  code: string;
  rate: number;
  updatedAt?: string;
  updated_at?: string;
};

export default function CurrencyRatesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get('/currency-rates');
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function refresh() {
    setBusy(true);
    try {
      const { data } = await api.post('/currency-rates/refresh');
      setItems(data.body?.rows || data.body || []);
    } finally {
      setBusy(false);
    }
  }

  const rows = items.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return r.code.toLowerCase().includes(q) || String(r.currencyName || r.currency_name || '').toLowerCase().includes(q);
  });

  return (
    <AdminListShell
      title="Currency Rates"
      icon={<Coins className="h-5 w-5 text-plum" />}
      search={search}
      onSearch={setSearch}
      tabs={LOCALIZATION_TABS}
      action={
        <button type="button" className={btnPrimary} onClick={refresh} disabled={busy}>
          <RefreshCw className="h-4 w-4" /> {busy ? 'Refreshing…' : 'Refresh Rates'}
        </button>
      }
    >
      <AdminPagedTable
        rows={rows}
        emptyTitle="No currency rates configured"
        columns={[
          { key: 'currency', header: 'Currency', render: (r) => r.currencyName || r.currency_name || r.code },
          { key: 'code', header: 'Code', render: (r) => r.code },
          { key: 'rate', header: 'Rate', render: (r) => Number(r.rate).toFixed(6) },
          {
            key: 'updated',
            header: 'Last updated',
            render: (r) => formatLogDate(String(r.updatedAt || r.updated_at || '')),
          },
        ]}
      />
    </AdminListShell>
  );
}
