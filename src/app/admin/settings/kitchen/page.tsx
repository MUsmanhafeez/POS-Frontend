'use client';

import { ChefHat } from 'lucide-react';
import SettingsFormShell from '@/components/admin/SettingsFormShell';

export default function KitchenSettingsPage() {
  return (
    <SettingsFormShell
      section="kitchen"
      title="Kitchen"
      icon={<ChefHat className="h-5 w-5 text-brand" />}
      defaults={{ kitchen_auto_refresh: true }}
    >
      {({ form, set }) => (
        <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--brand)]"
            checked={Boolean(form.kitchen_auto_refresh)}
            onChange={(e) => set('kitchen_auto_refresh', e.target.checked)}
          />
          Enable Auto refresh
        </label>
      )}
    </SettingsFormShell>
  );
}
