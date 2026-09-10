'use client';

import { useEffect, useState } from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';
import { btnSecondary } from '@/lib/ui';

type RateRow = { code?: string; rate?: number; updated_at?: string; updatedAt?: string };

export default function CurrencySettingsPage() {
  const [rates, setRates] = useState<RateRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  async function loadRates() {
    const { data } = await api.get('/currency-rates');
    setRates(data.body || []);
  }

  useEffect(() => {
    loadRates().catch(console.error);
  }, []);

  async function refreshRates() {
    setRefreshing(true);
    setRefreshMsg('');
    try {
      const { data } = await api.post('/currency-rates/refresh');
      setRefreshMsg(`Updated ${data.body?.refreshed ?? 0} rate(s).`);
      await loadRates();
    } catch (err: unknown) {
      setRefreshMsg(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Refresh failed'
      );
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SettingsFormShell
      section="currency"
      title="Currency"
      icon={<Coins className="h-5 w-5 text-brand" />}
      banner={
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnSecondary} disabled={refreshing} onClick={refreshRates}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh rates now'}
            </button>
            {refreshMsg ? <span className="text-sm text-muted">{refreshMsg}</span> : null}
          </div>
          {rates.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-muted">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr key={r.code} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold">{r.code}</td>
                      <td className="px-3 py-2 tabular-nums">{Number(r.rate || 0).toFixed(4)}</td>
                      <td className="px-3 py-2 text-muted">
                        {String(r.updated_at || r.updatedAt || '—').replace('T', ' ').slice(0, 19)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted">No currency rates in database yet. Refresh to initialize timestamps.</p>
          )}
        </div>
      }
      defaults={{
        supported_currencies: ['JOD', 'PKR', 'USD'],
        default_currency: 'JOD',
        currency_rate_service: '',
        auto_refresh_currency_rates: false,
      }}
    >
      {({ form, set }) => (
        <>
          <FloatingField label="Supported currencies">
            <input
              className={fieldClass}
              value={Array.isArray(form.supported_currencies) ? (form.supported_currencies as string[]).join(', ') : String(form.supported_currencies || '')}
              onChange={(e) =>
                set(
                  'supported_currencies',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean)
                )
              }
              placeholder="JOD, PKR, USD"
            />
          </FloatingField>
          <FloatingField label="Default currency">
            <select
              className={fieldClass}
              value={String(form.default_currency || 'JOD')}
              onChange={(e) => set('default_currency', e.target.value)}
            >
              {(Array.isArray(form.supported_currencies) ? (form.supported_currencies as string[]) : ['JOD', 'PKR', 'USD']).map(
                (c) => (
                  <option key={c} value={c}>{c}</option>
                )
              )}
            </select>
          </FloatingField>
          <FloatingField label="Currency rate service">
            <select
              className={fieldClass}
              value={String(form.currency_rate_service || '')}
              onChange={(e) => set('currency_rate_service', e.target.value)}
            >
              <option value="">None</option>
              <option value="openexchangerates">Open Exchange Rates</option>
              <option value="fixer">Fixer</option>
            </select>
          </FloatingField>
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand)]"
              checked={Boolean(form.auto_refresh_currency_rates)}
              onChange={(e) => set('auto_refresh_currency_rates', e.target.checked)}
            />
            Auto refresh currency rates (scheduled job uses this flag when enabled)
          </label>
        </>
      )}
    </SettingsFormShell>
  );
}
