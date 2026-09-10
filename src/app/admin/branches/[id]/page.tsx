'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, Field } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery', 'pick_up'];

type BusinessHours = Record<string, { open?: string; close?: string; closed?: boolean }>;

export default function BranchDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id || '');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<'settings' | 'tax' | 'devices' | 'zones' | 'menu'>('settings');
  const [serviceCharge, setServiceCharge] = useState('0');
  const [receiptTemplate, setReceiptTemplate] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [orderTypesEnabled, setOrderTypesEnabled] = useState<string[]>(ORDER_TYPES);
  const [quickPay, setQuickPay] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [holidays, setHolidays] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [taxName, setTaxName] = useState('VAT');
  const [taxRate, setTaxRate] = useState('0');
  const [products, setProducts] = useState<Array<{ id: string; name: unknown; price: number }>>([]);
  const [productId, setProductId] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [tables, setTables] = useState<Array<{ id: string; name: unknown }>>([]);
  const [qrTableId, setQrTableId] = useState(searchParams.get('table_id') || '');

  async function load() {
    const { data } = await api.get(`/branches/${id}/detail`);
    setDetail(data.body);
    const settings = data.body?.settings as Record<string, unknown> | null;
    const branch = data.body?.branch as Record<string, unknown> | undefined;
    setServiceCharge(String(settings?.service_charge_pct ?? settings?.serviceChargePct ?? 0));
    setReceiptTemplate(String(settings?.receipt_template ?? settings?.receiptTemplate ?? ''));
    setDefaultLanguage(String(settings?.default_language ?? settings?.defaultLanguage ?? 'en'));
    const ote = settings?.order_types_enabled ?? settings?.orderTypesEnabled;
    setOrderTypesEnabled(parseJsonArray(ote, ORDER_TYPES));
    const qp = branch?.quick_pay_amounts ?? branch?.quickPayAmounts;
    setQuickPay(parseJsonArray(qp, []).join(','));
    const bh = settings?.business_hours ?? settings?.businessHours;
    setBusinessHours(typeof bh === 'object' && bh ? (bh as BusinessHours) : {});
    const hol = settings?.holiday_calendar ?? settings?.holidayCalendar;
    setHolidays(Array.isArray(hol) ? hol.join('\n') : '');
  }

  function parseJsonArray(val: unknown, fallback: string[]) {
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') {
      try {
        const p = JSON.parse(val);
        return Array.isArray(p) ? p : fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  useEffect(() => {
    if (!id) return;
    load().catch(console.error);
    api.get('/products').then((res) => setProducts(res.data.body || [])).catch(console.error);
    api.get('/tables', { params: { branch_id: id } }).then((res) => setTables(res.data.body || [])).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const branch = detail?.branch as { name?: unknown; code?: string; branch_type?: string; status?: string } | undefined;

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    const quickPayAmounts = quickPay
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    await api.put(`/branches/${id}/settings`, {
      service_charge_pct: Number(serviceCharge),
      business_hours: businessHours,
      holiday_calendar: holidays.split('\n').map((s) => s.trim()).filter(Boolean),
      receipt_template: receiptTemplate,
      order_types_enabled: orderTypesEnabled,
      default_language: defaultLanguage,
      languages_supported: ['en', 'ar'],
      quick_pay_amounts: quickPayAmounts,
    });
    await load();
  }

  async function addDevice(e: FormEvent) {
    e.preventDefault();
    await api.post(`/branches/${id}/devices`, { name: deviceName, device_type: 'POS terminal', trusted: true });
    setDeviceName('');
    await load();
  }

  async function updateDevice(deviceId: string, patch: Record<string, string>) {
    await api.put(`/branches/${id}/devices/${deviceId}`, patch);
    await load();
  }

  async function heartbeat(deviceId: string) {
    await api.post(`/branches/${id}/devices/${deviceId}/heartbeat`, { status: 'active' });
    await load();
  }

  async function addZone(e: FormEvent) {
    e.preventDefault();
    await api.post(`/branches/${id}/delivery-zones`, { name: zoneName, radius_km: 5, delivery_fee: 100 });
    setZoneName('');
    await load();
  }

  async function addTax(e: FormEvent) {
    e.preventDefault();
    await api.post(`/branches/${id}/tax-profiles`, { name: taxName, tax_rate: Number(taxRate), tax_type: 'Sales Tax' });
    await load();
  }

  async function mapMenu(e: FormEvent) {
    e.preventDefault();
    await api.post(`/branches/${id}/menu-items`, {
      product_id: productId,
      is_available: true,
      price_override: priceOverride ? Number(priceOverride) : null,
    });
    setProductId('');
    setPriceOverride('');
    await load();
  }

  function toggleOrderType(t: string) {
    setOrderTypesEnabled((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const qrLink = qrTableId
    ? `/order/${id}?table_id=${qrTableId}`
    : `/order/${id}`;

  const tabs = [
    ['settings', 'Settings'],
    ['tax', 'Tax'],
    ['devices', 'Devices'],
    ['zones', 'Delivery'],
    ['menu', 'Menu mapping'],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-plum" />
          <div>
            <h1 className="text-xl font-bold">{labelOf(branch?.name) || 'Branch'}</h1>
            <p className="text-sm text-muted">
              {branch?.branch_type || 'dine-in'} · {branch?.status || 'active'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={fieldClass} value={qrTableId} onChange={(e) => setQrTableId(e.target.value)}>
            <option value="">QR — no table</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{labelOf(t.name)}</option>
            ))}
          </select>
          <Link href={qrLink} className="rounded-xl border px-3 py-2 text-sm" target="_blank">
            Open QR menu
          </Link>
          <Link href="/admin/branches" className="rounded-xl border px-3 py-2 text-sm">
            Back
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-3 py-2 text-sm ${tab === key ? 'bg-brand text-white' : 'border border-border'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <Card className="p-4">
          <form onSubmit={saveSettings} className="max-w-2xl space-y-4">
            <Field label="Service charge %">
              <input className={fieldClass} value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} />
            </Field>
            <Field label="Quick pay amounts (comma-separated)">
              <input className={fieldClass} placeholder="100,200,500" value={quickPay} onChange={(e) => setQuickPay(e.target.value)} />
            </Field>
            <Field label="Default language">
              <select className={fieldClass} value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </Field>
            <div>
              <div className="mb-2 text-sm font-medium">Order types enabled</div>
              <div className="flex flex-wrap gap-3">
                {ORDER_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={orderTypesEnabled.includes(t)} onChange={() => toggleOrderType(t)} />
                    {t.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Business hours">
              <div className="space-y-2 rounded-xl border border-border p-3">
                {DAYS.map((day) => (
                  <div key={day} className="grid grid-cols-[100px_1fr_1fr_auto] gap-2 items-center text-sm">
                    <span className="capitalize">{day}</span>
                    <input
                      type="time"
                      className={fieldClass}
                      value={businessHours[day]?.open || '09:00'}
                      onChange={(e) =>
                        setBusinessHours((h) => ({ ...h, [day]: { ...h[day], open: e.target.value, closed: false } }))
                      }
                    />
                    <input
                      type="time"
                      className={fieldClass}
                      value={businessHours[day]?.close || '22:00'}
                      onChange={(e) =>
                        setBusinessHours((h) => ({ ...h, [day]: { ...h[day], close: e.target.value, closed: false } }))
                      }
                    />
                    <label className="text-xs">
                      <input
                        type="checkbox"
                        checked={businessHours[day]?.closed === true}
                        onChange={(e) =>
                          setBusinessHours((h) => ({ ...h, [day]: { ...h[day], closed: e.target.checked } }))
                        }
                      />
                      Closed
                    </label>
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Holiday calendar (one date per line, YYYY-MM-DD)">
              <textarea className={fieldClass} rows={3} value={holidays} onChange={(e) => setHolidays(e.target.value)} />
            </Field>
            <Field label="Receipt template">
              <textarea className={fieldClass} rows={4} value={receiptTemplate} onChange={(e) => setReceiptTemplate(e.target.value)} />
            </Field>
            <button type="submit" className={btnPrimary}>Save settings</button>
          </form>
        </Card>
      ) : null}

      {tab === 'tax' ? (
        <Card className="space-y-4 p-4">
          <ul className="text-sm">
            {((detail?.tax_profiles as Array<{ id: string; name: string; tax_rate?: number; taxRate?: number }>) || []).map((t) => (
              <li key={t.id}>
                {t.name}: {t.tax_rate ?? t.taxRate}%
              </li>
            ))}
          </ul>
          <form onSubmit={addTax} className="flex flex-wrap gap-2">
            <input className={fieldClass} placeholder="Name" value={taxName} onChange={(e) => setTaxName(e.target.value)} />
            <input className={fieldClass} placeholder="Rate" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            <button type="submit" className={btnPrimary}>Add tax profile</button>
          </form>
        </Card>
      ) : null}

      {tab === 'devices' ? (
        <Card className="space-y-4 p-4">
          <ul className="space-y-3 text-sm">
            {((detail?.devices as Array<{
              id: string;
              name: string;
              device_type?: string;
              trusted?: boolean;
              ip_address?: string;
              mac_address?: string;
              status?: string;
              last_sync_at?: string;
              lastSyncAt?: string;
              pos_register_id?: string;
            }>) || []).map((d) => (
              <li key={d.id} className="rounded-xl border border-border p-3">
                <div className="font-semibold">{d.name} · {d.device_type} {d.trusted ? '(trusted)' : ''}</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    className={fieldClass}
                    placeholder="IP address"
                    defaultValue={d.ip_address || ''}
                    onBlur={(e) => updateDevice(d.id, { ip_address: e.target.value })}
                  />
                  <input
                    className={fieldClass}
                    placeholder="MAC address"
                    defaultValue={d.mac_address || ''}
                    onBlur={(e) => updateDevice(d.id, { mac_address: e.target.value })}
                  />
                </div>
                <div className="mt-2 text-xs text-muted">
                  Status: {d.status || 'active'} · Last sync: {d.last_sync_at || d.lastSyncAt || '—'}
                  {d.pos_register_id ? ` · Register ${d.pos_register_id}` : ''}
                </div>
                <button type="button" className="mt-2 text-xs text-brand" onClick={() => heartbeat(d.id)}>
                  Send heartbeat
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addDevice} className="flex gap-2">
            <input className={fieldClass} required placeholder="Device name" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
            <button type="submit" className={btnPrimary}>Register</button>
          </form>
        </Card>
      ) : null}

      {tab === 'zones' ? (
        <Card className="space-y-4 p-4">
          <ul className="text-sm">
            {((detail?.delivery_zones as Array<{ id: string; name: string; delivery_fee?: number }>) || []).map((z) => (
              <li key={z.id}>
                {z.name} · fee {z.delivery_fee}
              </li>
            ))}
          </ul>
          <form onSubmit={addZone} className="flex gap-2">
            <input className={fieldClass} required placeholder="Zone name" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
            <button type="submit" className={btnPrimary}>Add zone</button>
          </form>
        </Card>
      ) : null}

      {tab === 'menu' ? (
        <Card className="space-y-4 p-4">
          <ul className="text-sm">
            {((detail?.menu_items as Array<{ id: string; product_name?: unknown; price_override?: number; is_available?: boolean }>) || []).map(
              (m) => (
                <li key={m.id}>
                  {labelOf(m.product_name)} · override {m.price_override ?? '—'} · {m.is_available === false ? 'off' : 'on'}
                </li>
              )
            )}
          </ul>
          <form onSubmit={mapMenu} className="flex flex-wrap gap-2">
            <select className={fieldClass} required value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {labelOf(p.name)}
                </option>
              ))}
            </select>
            <input className={fieldClass} placeholder="Price override" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} />
            <button type="submit" className={btnPrimary}>Map item</button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
