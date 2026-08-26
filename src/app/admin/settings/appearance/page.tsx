'use client';

import { Palette } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';

const COLORS = [
  { key: 'primary_color', label: 'Primary Color', fallback: '#714B67' },
  { key: 'secondary_color', label: 'Secondary Color', fallback: '#00A09D' },
  { key: 'success_color', label: 'Success Color', fallback: '#24A148' },
  { key: 'info_color', label: 'Info Color', fallback: '#007BFF' },
  { key: 'warning_color', label: 'Warning Color', fallback: '#F1C40F' },
  { key: 'error_color', label: 'Error Color', fallback: '#DA3E3E' },
] as const;

export default function AppearanceSettingsPage() {
  return (
    <SettingsFormShell
      section="appearance"
      title="Appearance"
      icon={<Palette className="h-5 w-5 text-brand" />}
      showReset
      defaults={{
        theme_mode: 'light',
        primary_color: '#714B67',
        secondary_color: '#00A09D',
        success_color: '#24A148',
        info_color: '#007BFF',
        warning_color: '#F1C40F',
        error_color: '#DA3E3E',
      }}
    >
      {({ form, set }) => (
        <>
          <FloatingField label="Default Theme Mode">
            <select
              className={fieldClass}
              value={String(form.theme_mode || 'light')}
              onChange={(e) => set('theme_mode', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </FloatingField>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {COLORS.map((c) => {
              const value = String(form[c.key] || c.fallback);
              return (
                <FloatingField key={c.key} label={c.label}>
                  <div className="flex items-center gap-2">
                    <input
                      className={fieldClass}
                      value={value}
                      onChange={(e) => set(c.key, e.target.value)}
                    />
                    <input
                      type="color"
                      className="h-11 w-12 cursor-pointer rounded-xl border border-border-strong bg-surface p-1"
                      value={value}
                      onChange={(e) => set(c.key, e.target.value)}
                    />
                  </div>
                </FloatingField>
              );
            })}
          </div>
        </>
      )}
    </SettingsFormShell>
  );
}
