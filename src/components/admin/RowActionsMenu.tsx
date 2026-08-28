'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useT } from '@/stores/locale';

export type RowActionItem = {
  key?: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
};

export type RowActionsConfig = {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
  hideEdit?: boolean;
  hideDelete?: boolean;
  hideView?: boolean;
  extra?: RowActionItem[];
};

type MenuPos = { top: number; left: number };

const MENU_WIDTH = 168;
const MENU_ITEM_HEIGHT = 40;
const MENU_PADDING = 8;

export function RowActionsMenu({ actions }: { actions: RowActionsConfig }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const items: RowActionItem[] = [];

  if (!actions.hideView && actions.onView) {
    items.push({
      key: 'view',
      label: actions.viewLabel || t('View'),
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        actions.onView?.();
      },
    });
  }

  if (!actions.hideEdit && actions.onEdit) {
    items.push({
      key: 'edit',
      label: actions.editLabel || t('Edit'),
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        actions.onEdit?.();
      },
    });
  }

  if (actions.extra?.length) {
    for (const item of actions.extra) {
      if (!item.hidden) items.push(item);
    }
  }

  if (!actions.hideDelete && actions.onDelete) {
    items.push({
      key: 'delete',
      label: actions.deleteLabel || t('Delete'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        actions.onDelete?.();
      },
      danger: true,
    });
  }

  function placeMenu() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = items.length * MENU_ITEM_HEIGHT + MENU_PADDING;
    const gap = 6;

    let top = rect.bottom + gap;
    let left = rect.right - MENU_WIDTH;

    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - MENU_WIDTH - 8;
    }
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - gap;
    }

    setPos({ top, left });
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onReflow() {
      placeMenu();
    }

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, items.length]);

  if (!items.length) {
    return (
      <button type="button" disabled className="rounded-lg p-1.5 text-muted/40" aria-label={t('Actions')}>
        <MoreVertical className="h-4 w-4" />
      </button>
    );
  }

  const menu = open ? (
    <div
      ref={rootRef}
      style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
      className="fixed z-[200] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl ring-1 ring-black/5"
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.key || item.label}
          type="button"
          role="menuitem"
          className={clsx(
            'flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm transition hover:bg-surface-muted',
            item.danger ? 'text-danger' : 'text-foreground'
          )}
          onClick={item.onClick}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="inline-block text-start">
      <button
        ref={buttonRef}
        type="button"
        className="rounded-lg p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
        aria-label={t('Actions')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

export async function confirmRowDelete(label: string) {
  return window.confirm(`Delete "${label}"? This action cannot be undone.`);
}

export type TableRowActions<T extends { id: string }> = (row: T) => RowActionsConfig;
