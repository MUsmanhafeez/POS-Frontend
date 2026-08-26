'use client';

import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function SettingsSection({ title, description, icon: Icon }: Props) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
        <Icon className="h-5 w-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-6 rounded-xl border border-dashed border-border-strong bg-surface-muted/60 px-4 py-8 text-center text-sm text-muted">
        Settings fields for {title.toLowerCase()} will appear here.
      </div>
    </div>
  );
}
