'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import clsx from 'clsx';
import { SETTINGS_NAV } from '@/lib/nav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/admin/settings') {
      router.replace('/admin/settings/general');
    }
  }, [pathname, router]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forkiva Settings</h1>
        <p className="mt-1 text-sm text-muted">Configure locales, appearance, kitchen, and system defaults.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="grid min-h-[32rem] md:grid-cols-[15rem_1fr]">
          <aside className="border-b border-border bg-surface-muted/50 md:border-b-0 md:border-r">
            <nav className="space-y-0.5 p-3">
              {SETTINGS_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition',
                      active
                        ? 'bg-brand-soft font-medium text-brand'
                        : 'text-foreground/80 hover:bg-surface hover:text-foreground'
                    )}
                  >
                    <Icon className={clsx('h-4 w-4', active ? 'text-brand' : 'text-muted')} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="min-w-0 p-5 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
