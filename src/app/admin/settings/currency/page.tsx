'use client';

import { Coins } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';

export default function CurrencySettingsPage() {
  return (
    <SettingsFormShell
      section="currency"
      title="Currency"
      icon={<Coins className="h-5 w-5 text-brand" />}
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
                    .map((s) => s.trim())
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
              <option value="JOD">Jordanian Dinar</option>
              <option value="PKR">Pakistani Rupee</option>
              <option value="USD">US Dollar</option>
              <option value="AED">UAE Dirham</option>
              <option value="SAR">Saudi Riyal</option>
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
            Auto refresh currency rates
          </label>
        </>
      )}
    </SettingsFormShell>
  );
}
