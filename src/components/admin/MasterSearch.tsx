'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/api';
import { useT } from '@/stores/locale';

type SearchResult = {
  type: string;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
};

const TYPE_LABELS: Record<string, string> = {
  order: 'Orders',
  customer: 'Customers',
  product: 'Products',
  invoice: 'Invoices',
  user: 'Users',
  branch: 'Branches',
  table: 'Tables',
};

export default function MasterSearch() {
  const router = useRouter();
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatResults = results;

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/search', { params: { q: q.trim(), limit: 20 } });
      setResults(data.body?.results || []);
      setActiveIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        setMobileOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setMobileOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!flatResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatResults[activeIndex]) {
      e.preventDefault();
      navigate(flatResults[activeIndex].href);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setMobileOpen(false);
    }
  }

  const grouped = flatResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const dropdown =
    open && query.trim().length >= 2 ? (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
        {loading ? (
          <div className="px-4 py-3 text-sm text-muted">{t('Searching…')}</div>
        ) : flatResults.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted">{t('No results for')} “{query.trim()}”</div>
        ) : (
          <div className="max-h-72 overflow-y-auto py-1">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t(TYPE_LABELS[type] || type)}
                </div>
                {items.map((r) => {
                  const idx = flatResults.indexOf(r);
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => navigate(r.href)}
                      className={clsx(
                        'flex w-full flex-col px-3 py-2 text-left text-sm transition hover:bg-surface-muted',
                        idx === activeIndex && 'bg-brand-soft'
                      )}
                    >
                      <span className="font-medium text-foreground">{r.label}</span>
                      {r.sublabel ? <span className="text-xs text-muted">{r.sublabel}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      {/* Desktop */}
      <div className="relative hidden min-w-0 flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={t('Search orders, customers, products…')}
          className="h-9 w-full rounded-xl border border-border bg-surface-muted/60 pe-3 ps-9 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <span className="pointer-events-none absolute end-2 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted lg:inline">
          ⌘K
        </span>
        {dropdown}
      </div>

      {/* Mobile trigger */}
      <button
        type="button"
        className="rounded-lg p-2 text-muted transition hover:bg-surface-muted hover:text-foreground md:hidden"
        aria-label={t('Search')}
        onClick={() => {
          setMobileOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Search className="h-4 w-4" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute inset-x-0 top-0 border-b border-border bg-surface p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onKeyDown={onKeyDown}
                placeholder={t('Search anything…')}
                className="h-10 w-full rounded-xl border border-border bg-surface-muted pe-3 ps-9 text-sm"
              />
            </div>
            {open && query.trim().length >= 2 && (
              <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface">
                {loading ? (
                  <div className="px-4 py-3 text-sm text-muted">{t('Searching…')}</div>
                ) : flatResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted">{t('No results')}</div>
                ) : (
                  flatResults.map((r, idx) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      type="button"
                      onClick={() => navigate(r.href)}
                      className={clsx(
                        'flex w-full flex-col px-3 py-2 text-left text-sm',
                        idx === activeIndex && 'bg-brand-soft'
                      )}
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-muted">{TYPE_LABELS[r.type]} · {r.sublabel || r.type}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
