'use client';

import { Smartphone } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';

export default function PwaSettingsPage() {
  return (
    <SettingsFormShell
      section="pwa"
      title="PWA"
      icon={<Smartphone className="h-5 w-5 text-brand" />}
      defaults={{
        pwa_enabled: false,
        pwa_name: 'Forkiva',
        pwa_short_name: 'Forkiva',
        pwa_icon: '',
        pwa_background_color: '#ffffff',
        pwa_theme_color: '#ffffff',
        pwa_description: 'Forkiva restaurant POS and management system.',
      }}
    >
      {({ form, set }) => (
        <>
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand)]"
              checked={Boolean(form.pwa_enabled)}
              onChange={(e) => set('pwa_enabled', e.target.checked)}
            />
            Enable PWA
          </label>

          <FloatingField label="PWA Name">
            <input className={fieldClass} value={String(form.pwa_name || '')} onChange={(e) => set('pwa_name', e.target.value)} />
          </FloatingField>
          <FloatingField label="PWA Short Name">
            <input className={fieldClass} value={String(form.pwa_short_name || '')} onChange={(e) => set('pwa_short_name', e.target.value)} />
          </FloatingField>
          <FloatingField label="PWA Icon URL">
            <input className={fieldClass} value={String(form.pwa_icon || '')} onChange={(e) => set('pwa_icon', e.target.value)} placeholder="https://..." />
          </FloatingField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FloatingField label="Background Color">
              <div className="flex gap-2">
                <input className={fieldClass} value={String(form.pwa_background_color || '#ffffff')} onChange={(e) => set('pwa_background_color', e.target.value)} />
                <input type="color" className="h-11 w-12 rounded-xl border border-border-strong p-1" value={String(form.pwa_background_color || '#ffffff')} onChange={(e) => set('pwa_background_color', e.target.value)} />
              </div>
            </FloatingField>
            <FloatingField label="Theme Color">
              <div className="flex gap-2">
                <input className={fieldClass} value={String(form.pwa_theme_color || '#ffffff')} onChange={(e) => set('pwa_theme_color', e.target.value)} />
                <input type="color" className="h-11 w-12 rounded-xl border border-border-strong p-1" value={String(form.pwa_theme_color || '#ffffff')} onChange={(e) => set('pwa_theme_color', e.target.value)} />
              </div>
            </FloatingField>
          </div>

          <FloatingField label="Description">
            <textarea
              className={fieldClass}
              rows={3}
              value={String(form.pwa_description || '')}
              onChange={(e) => set('pwa_description', e.target.value)}
            />
          </FloatingField>
        </>
      )}
    </SettingsFormShell>
  );
}
