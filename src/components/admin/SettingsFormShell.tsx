'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { Field } from '@/components/ui';
import { btnPrimary, btnSecondary, fieldClass } from '@/lib/ui';
import { useThemeStore } from '@/stores/theme';
import { useLocaleStore } from '@/stores/locale';
import { useAppSettingsStore } from '@/stores/appSettings';
import type { AppearanceColors } from '@/lib/theme';

type Props = {
  section: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  defaults: Record<string, unknown>;
  children: (args: {
    form: Record<string, unknown>;
    set: (key: string, value: unknown) => void;
  }) => React.ReactNode;
  banner?: React.ReactNode;
  showReset?: boolean;
};

function pickPayload(form: Record<string, unknown>, defaults: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) {
    if (key in form) out[key] = form[key];
  }
  return out;
}

export default function SettingsFormShell({
  section,
  title,
  icon,
  description,
  defaults,
  children,
  banner,
  showReset,
}: Props) {
  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    api
      .get(`/settings/${section}`)
      .then((r) => setForm({ ...defaults, ...(r.data.body || {}) }))
      .catch(() => setForm(defaults));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    if (section !== 'appearance') return;
    useThemeStore.getState().apply(form as AppearanceColors);
  }, [form, section]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = pickPayload(form, defaults);
      await api.put(`/settings/${section}`, payload);
      const { data } = await api.get(`/settings/${section}`);
      const merged = { ...defaults, ...(data.body || {}) };
      setForm(merged);

      if (section === 'appearance') {
        useThemeStore.getState().apply(merged as AppearanceColors);
      }
      if (section === 'general' && merged.default_locale) {
        const loc = String(merged.default_locale);
        if (loc === 'en' || loc === 'ar') {
          useLocaleStore.getState().setLocale(loc);
        }
      }
      if (section === 'application' && merged.app_name) {
        useAppSettingsStore.getState().setAppName(String(merged.app_name));
      }

      setMessageType('success');
      setMessage('Settings saved successfully.');
    } catch (err: unknown) {
      setMessageType('error');
      setMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setForm(defaults);
    if (section === 'appearance') {
      useThemeStore.getState().apply(defaults as AppearanceColors);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        {icon}
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {description && <p className="text-sm font-medium text-muted">{description}</p>}
        </div>
      </div>

      {banner}

      <div className="space-y-4">{children({ form, set })}</div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        {showReset && (
          <button type="button" className={btnSecondary} onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
        <button type="submit" className={btnPrimary} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {message ? (
        <div
          className={`fixed end-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            messageType === 'success'
              ? 'border-success/30 bg-success-soft text-success'
              : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}

export function FloatingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="absolute -top-2 left-3 z-10 bg-surface px-1 text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

export { Field, fieldClass };
