'use client';

import { FolderOpen } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';
import { Badge } from '@/components/ui';

export default function FilesystemSettingsPage() {
  return (
    <SettingsFormShell
      section="filesystem"
      title="Filesystem"
      icon={<FolderOpen className="h-5 w-5 text-brand" />}
      banner={
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
          Choose where public and private files are stored. S3 credentials are configured separately for each side.
        </div>
      }
      defaults={{ public_disk: 'public', private_disk: 'local' }}
    >
      {({ form, set }) => (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground">Public Disk</h3>
              <Badge tone="info">Public</Badge>
            </div>
            <p className="mb-3 text-sm font-medium text-muted">Media and publicly accessible files</p>
            <FloatingField label="Public Disk">
              <select className={fieldClass} value={String(form.public_disk || 'public')} onChange={(e) => set('public_disk', e.target.value)}>
                <option value="public">Public</option>
                <option value="s3">S3</option>
              </select>
            </FloatingField>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground">Private Disk</h3>
              <Badge tone="neutral">Local</Badge>
            </div>
            <p className="mb-3 text-sm font-medium text-muted">Internal documents, generated assets, and private app files</p>
            <FloatingField label="Private Disk">
              <select className={fieldClass} value={String(form.private_disk || 'local')} onChange={(e) => set('private_disk', e.target.value)}>
                <option value="local">Local</option>
                <option value="s3-private">S3 Private</option>
              </select>
            </FloatingField>
          </div>
        </div>
      )}
    </SettingsFormShell>
  );
}
