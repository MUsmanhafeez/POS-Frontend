'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminPageSkeleton from '@/components/admin/AdminPageSkeleton';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import IdleTimeoutGuard from '@/components/admin/IdleTimeoutGuard';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore, useT } from '@/stores/locale';
import { useNavPending } from '@/stores/navPending';
import { useAppSettingsStore } from '@/stores/appSettings';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const navPending = useNavPending((s) => s.pending);
  const donePending = useNavPending((s) => s.done);
  const appName = useAppSettingsStore((s) => s.appName);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    const saved = localStorage.getItem('forkiva-sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
    document.documentElement.classList.toggle('dark', localStorage.getItem('forkiva-theme') === 'dark');
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace('/auth/login');
  }, [hydrated, token, router]);

  useEffect(() => {
    setMobileOpen(false);
    donePending();
  }, [pathname, donePending]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('forkiva-sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

  const posSegment = pathname.startsWith('/admin/pos/') ? pathname.split('/')[3] : null;
  const posAdminTabs = new Set(['opening-closing', 'registers']);
  const immersive =
    pathname === '/admin/kitchen' ||
    (posSegment != null && !posAdminTabs.has(posSegment));
  const isRtl = locale === 'ar';

  if (!hydrated || !token || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-brand/20" />
          <span className="text-sm">Loading {appName}…</span>
        </div>
      </div>
    );
  }

  if (immersive) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRtl ? 'rtl' : 'ltr'}>
      <IdleTimeoutGuard />
      <div className="flex min-h-screen">
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label={t('Close menu')}
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={[
            'fixed inset-y-0 z-50 lg:static lg:z-auto',
            isRtl ? 'right-0' : 'left-0',
            mobileOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0',
            'transition-transform duration-200',
          ].join(' ')}
        >
          <AdminSidebar
            collapsed={collapsed}
            onToggle={toggleCollapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            onToggleSidebar={() => {
              if (window.matchMedia('(max-width: 1023px)').matches) setMobileOpen((v) => !v);
              else toggleCollapsed();
            }}
          />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            {navPending ? <AdminPageSkeleton /> : children}
          </main>
          <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted sm:px-6">
            © {new Date().getFullYear()} {t('Developed with care by Devsilicon')}
          </footer>
        </div>
      </div>
    </div>
  );
}
