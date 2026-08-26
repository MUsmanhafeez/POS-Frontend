'use client';

import { ImagePlus, Image as ImageIcon } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';

function UploadBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FloatingField label={label}>
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/50 p-4">
        <div className="mb-3 flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-surface">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="max-h-24 object-contain" />
          ) : (
            <div className="flex flex-col items-center text-muted">
              <ImagePlus className="h-8 w-8" />
              <span className="mt-1 text-xs font-medium">Upload</span>
            </div>
          )}
        </div>
        <input
          className={fieldClass}
          placeholder="Image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </FloatingField>
  );
}

export default function LogoSettingsPage() {
  return (
    <SettingsFormShell
      section="logo"
      title="Logo"
      icon={<ImageIcon className="h-5 w-5 text-brand" />}
      defaults={{ logo_url: '', favicon_url: '' }}
    >
      {({ form, set }) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <UploadBox label="Logo" value={String(form.logo_url || '')} onChange={(v) => set('logo_url', v)} />
          <UploadBox label="Favicon" value={String(form.favicon_url || '')} onChange={(v) => set('favicon_url', v)} />
        </div>
      )}
    </SettingsFormShell>
  );
}
