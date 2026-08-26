'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui';
import { btnSecondary } from '@/lib/ui';

export default function ModulePlaceholder({
  title,
  description,
  href = '/admin',
}: {
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description || `${title} module is ready in navigation and will grow with full CRUD.`}
        action={
          <Link href={href} className={btnSecondary}>
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        }
      />
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-muted">
          This section is wired into the sidebar and dashboard. Data APIs and full screens can be extended next.
        </p>
      </Card>
    </div>
  );
}
