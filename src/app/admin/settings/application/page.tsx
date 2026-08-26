'use client';

import { MonitorSmartphone } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';

export default function ApplicationSettingsPage() {
  return (
    <SettingsFormShell
      section="application"
      title="Application"
      icon={<MonitorSmartphone className="h-5 w-5 text-brand" />}
      defaults={{ app_name: 'Forkiva' }}
    >
      {({ form, set }) => (
        <FloatingField label="App Name (English)">
          <input
            className={fieldClass}
            value={String(form.app_name || '')}
            onChange={(e) => set('app_name', e.target.value)}
          />
        </FloatingField>
      )}
    </SettingsFormShell>
  );
}
