'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export type SectionTab = { href: string; label: string };

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (pathname === href) return true;
    if (href !== '/admin/tools' && pathname.startsWith(`${href}/`)) return true;
    return false;
  }

  return (
    <div className="mb-4 flex gap-2 border-b border-border">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-semibold transition',
              active ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
