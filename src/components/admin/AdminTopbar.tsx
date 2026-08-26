'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  ChevronDown,
  Globe2,
  Lock,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Plus,
  Sun,
  UserRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore, useT } from '@/stores/locale';

type Props = {
  onToggleSidebar?: () => void;
};

export default function AdminTopbar({ onToggleSidebar }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lockedHint, setLockedHint] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const lang = locale === 'ar' ? 'AR' : 'EN';

  useEffect(() => {
    const stored = localStorage.getItem('forkiva-theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    function onFsChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('forkiva-theme', next ? 'dark' : 'light');
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }

  const initial = (user?.name || 'F').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-[var(--topbar-height)] items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
          aria-label={t('Toggle sidebar')}
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="hidden truncate text-sm text-muted sm:block">
          {t('Welcome back,')} <span className="font-medium text-foreground">{user?.name}</span>
        </div>
      </div>

      <div className="relative flex items-center gap-1.5">
        <TopIconButton label={t('Kitchen viewer')} onClick={() => router.push('/admin/kitchen')}>
          <ChefHat className="h-4 w-4" />
        </TopIconButton>

        <TopIconButton
          label={t('Lock screen')}
          onClick={() => {
            setLockedHint(true);
            window.setTimeout(() => setLockedHint(false), 1800);
          }}
        >
          <Lock className="h-4 w-4" />
        </TopIconButton>
        {lockedHint && (
          <span className="absolute end-0 top-12 z-50 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted shadow-lg">
            {t('Screen lock coming soon')}
          </span>
        )}

        <TopIconButton
          label={fullscreen ? t('Exit fullscreen') : t('Enter fullscreen')}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </TopIconButton>

        <TopIconButton
          label={dark ? t('Switch to light mode') : t('Switch to dark mode')}
          onClick={toggleTheme}
        >
          {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </TopIconButton>

        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            <Globe2 className="h-4 w-4" />
            <span className="font-medium">{lang}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {langOpen && (
            <div className="absolute end-0 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
              {(
                [
                  { code: 'EN', locale: 'en' as const, label: 'English' },
                  { code: 'AR', locale: 'ar' as const, label: 'Arabic' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    setLocale(opt.locale);
                    setLangOpen(false);
                  }}
                  className={clsx(
                    'flex w-full items-center px-3 py-2 text-start text-sm transition hover:bg-surface-muted',
                    locale === opt.locale && 'bg-brand-soft text-brand'
                  )}
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="ms-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-600 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            aria-label={t('Open account menu')}
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute end-0 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">{user?.name}</div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {user?.role.display_name || 'Admin'}
                  </span>
                </div>
                <div className="mt-1 truncate text-xs text-muted">{user?.email || user?.username}</div>
              </div>

              <div className="p-2">
                <MenuLink href="/admin/users" icon={<UserRound className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                  {t('My Account')}
                </MenuLink>
                <MenuLink href="/admin/settings/general" icon={<Lock className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                  {t('Update Password')}
                </MenuLink>
              </div>

              <div className="border-t border-border px-4 py-2">
                <div className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-muted">{t('ACCOUNTS')}</div>
                <div className="rounded-xl bg-brand-soft px-3 py-2">
                  <div className="text-sm font-medium text-brand">{user?.name}</div>
                  <div className="truncate text-xs text-muted">{user?.email || user?.username}</div>
                </div>
                <button
                  type="button"
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  {t('Add another account')}
                </button>
              </div>

              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    router.push('/auth/login');
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  {t('Logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function TopIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-lg p-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/80 transition hover:bg-surface-muted"
    >
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}
