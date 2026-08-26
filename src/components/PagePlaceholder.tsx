import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { btnPrimary } from '@/lib/ui';

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: { href: string; label: string }[];
};

export default function PagePlaceholder({ title, description, icon: Icon, actions = [] }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <div className="border-b border-border bg-gradient-to-br from-brand-soft via-surface to-surface px-5 py-7 sm:px-6 sm:py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <p className="text-sm text-muted">
            This module is available in navigation. Expand it further as your Forkiva workflows grow.
          </p>
          {actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Link key={action.href} href={action.href} className={btnPrimary}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
