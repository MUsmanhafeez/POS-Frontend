'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { btnGhost, btnPrimary, btnSecondary, cn } from '@/lib/ui';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close dialog" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button type="button" className={btnGhost} onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 h-1.5 w-14 rounded-full bg-gradient-to-r from-brand via-accent to-plum" />
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]', className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'accent' | 'plum';
}) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    brand: 'bg-brand-soft text-brand',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
    accent: 'bg-accent-soft text-accent',
    plum: 'bg-plum-soft text-plum',
  };
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-soft to-accent-soft text-brand">
        <span className="text-lg font-bold">+</span>
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm font-medium leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export function FormActions({
  onCancel,
  saving,
  submitLabel = 'Save',
  formId,
}: {
  onCancel: () => void;
  saving?: boolean;
  submitLabel?: string;
  formId?: string;
}) {
  return (
    <>
      <button type="button" className={btnSecondary} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" form={formId} className={btnPrimary} disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </>
  );
}

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle = 'No records yet',
  emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!rows.length) {
    return (
      <Card>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Card>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <Card key={row.id} className="p-4">
            <dl className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">{col.header}</dt>
                  <dd className="text-right text-sm text-foreground">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-muted text-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border text-foreground">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
