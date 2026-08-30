'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import clsx from 'clsx';
import { ADMIN_NAV, type NavItem } from '@/lib/nav';
import { useAuthStore } from '@/stores/auth';
import { useNavPending } from '@/stores/navPending';
import { useT } from '@/stores/locale';
import { appInitial, useAppSettingsStore } from '@/stores/appSettings';

/** Exact match only — so /admin/pos does not select when on /admin/pos/opening-closing. */
function isExactActive(pathname: string, href: string) {
  return pathname === href;
}

function itemVisible(item: NavItem, can: (...p: string[]) => boolean) {
  if (!item.permission) return true;
  return can(item.permission);
}

function groupContainsPath(item: NavItem, pathname: string) {
  if (pathname === item.href) return true;
  return Boolean(item.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`)));
}

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

export default function AdminSidebar({ collapsed, onToggle, onNavigate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = useAuthStore();
  const t = useT();
  const appName = useAppSettingsStore((s) => s.appName);
  const pendingHref = useNavPending((s) => s.href);
  const startPending = useNavPending((s) => s.start);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const selectedHref = pendingHref || pathname;

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const section of ADMIN_NAV) {
      for (const item of section.items) {
        next[item.href] = groupContainsPath(item, pathname);
      }
    }
    setOpenGroups(next);
  }, [pathname]);

  function go(href: string) {
    if (href === pathname) return;
    startPending(href);
    onNavigate?.();
    router.push(href);
  }

  const slim = collapsed;

  return (
    <aside
      className={clsx(
        'flex h-screen shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-200',
        'w-[var(--sidebar-width)]',
        slim && 'lg:w-[4.5rem]'
      )}
    >
      <div className="flex h-[var(--topbar-height)] items-center gap-2 border-b border-border bg-gradient-to-r from-brand-soft via-surface to-accent-soft/40 px-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-teal-600 text-sm font-bold text-white shadow-sm">
          {appInitial(appName)}
        </div>
        {!slim && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold tracking-[0.14em] text-foreground">{appName.toUpperCase()}</div>
            <div className="truncate text-[11px] font-medium text-brand">{t('Restaurant OS')}</div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="ms-auto hidden rounded-lg p-2 text-muted transition hover:bg-white/70 hover:text-foreground lg:inline-flex"
          aria-label={slim ? t('Expand sidebar') : t('Collapse sidebar')}
        >
          {slim ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {ADMIN_NAV.map((section) => {
          const visibleItems = section.items.filter((item) => itemVisible(item, can));
          if (section.id === 'apps' && visibleItems.length === 0) {
            return (
              <div key={section.id} className="mb-4 px-2">
                {!slim && section.label && (
                  <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.16em] text-muted">
                    {t(section.label)}
                  </div>
                )}
                {!slim && (
                  <div className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted">
                    {t('No apps installed')}
                  </div>
                )}
              </div>
            );
          }
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} className="mb-4">
              {!slim && section.label && (
                <div className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted">
                  {t(section.label)}
                </div>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children?.length);
                  const active = !hasChildren && isExactActive(selectedHref, item.href);
                  const inSection = hasChildren && groupContainsPath(item, selectedHref);
                  const open = openGroups[item.href];
                  const label = t(item.label);

                  return (
                    <li key={item.href}>
                      <div className="relative">
                        <Link
                          href={item.href}
                          prefetch={false}
                          title={slim ? label : undefined}
                          onMouseEnter={() => router.prefetch(item.href)}
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasChildren) {
                              setOpenGroups((prev) => {
                                const willOpen = !prev[item.href];
                                const next: Record<string, boolean> = {};
                                for (const section of ADMIN_NAV) {
                                  for (const navItem of section.items) next[navItem.href] = false;
                                }
                                next[item.href] = willOpen || inSection;
                                return next;
                              });
                              go(item.href);
                              return;
                            }
                            go(item.href);
                          }}
                          className={clsx(
                            'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition',
                            active
                              ? 'bg-brand-soft font-medium text-brand'
                              : inSection
                                ? 'text-foreground font-medium'
                                : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground'
                          )}
                        >
                          <Icon
                            className={clsx(
                              'h-[18px] w-[18px] shrink-0',
                              active || inSection ? 'text-brand' : 'text-muted'
                            )}
                          />
                          <span className={clsx('min-w-0 flex-1 truncate', slim && 'lg:hidden')}>{label}</span>
                          {!slim && hasChildren && (
                            <button
                              type="button"
                              aria-label={`Toggle ${label}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenGroups((prev) => {
                                  const willOpen = !prev[item.href];
                                  const next: Record<string, boolean> = {};
                                  for (const section of ADMIN_NAV) {
                                    for (const navItem of section.items) next[navItem.href] = false;
                                  }
                                  next[item.href] = willOpen;
                                  return next;
                                });
                              }}
                              className="rounded-md p-0.5 text-muted hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
                            >
                              <ChevronDown className={clsx('h-4 w-4 transition', open && 'rotate-180')} />
                            </button>
                          )}
                          {slim && hasChildren && <span className="hidden lg:block" />}
                        </Link>
                        {active && (
                          <span className="absolute inset-y-1.5 end-0 w-[3px] rounded-s-full bg-brand" />
                        )}
                      </div>

                      {hasChildren && open && (
                        <ul className={clsx('mt-0.5 space-y-0.5 border-s border-border ms-5 ps-2', slim && 'lg:hidden')}>
                          {item.children!
                            .filter((c) => !c.permission || can(c.permission))
                            .map((child) => {
                              const childActive = isExactActive(selectedHref, child.href);
                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    prefetch={false}
                                    onMouseEnter={() => router.prefetch(child.href)}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      go(child.href);
                                    }}
                                    className={clsx(
                                      'block rounded-lg px-2.5 py-1.5 text-[13px] transition',
                                      childActive
                                        ? 'bg-brand-soft font-medium text-brand'
                                        : 'text-muted hover:bg-surface-muted hover:text-foreground'
                                    )}
                                  >
                                    {t(child.label)}
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
