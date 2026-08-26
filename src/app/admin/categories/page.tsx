'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, ImageIcon, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Category = {
  id: string;
  name: unknown;
  slug?: string | null;
  parentId?: string | null;
  menuId?: string;
  isActive?: boolean;
  children?: Category[];
};

type Menu = { id: string; name: unknown };

function buildTree(items: Category[]): Category[] {
  const map = new Map<string, Category>();
  items.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Category[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  selectedId,
  onSelect,
}: {
  node: Category;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const hasKids = (node.children?.length || 0) > 0;
  const open = expanded.has(node.id);
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-sm ${
          selectedId === node.id ? 'bg-plum/10 text-plum' : 'hover:bg-surface-muted'
        }`}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {hasKids ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="inline-flex"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        ) : (
          <span className="inline-block w-4" />
        )}
        <span className="font-medium">{labelOf(node.name)}</span>
      </button>
      {hasKids && open
        ? node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'root' | 'sub'>('root');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', menu_id: '', is_active: true });

  async function load() {
    const [c, m] = await Promise.all([api.get('/categories'), api.get('/menus')]);
    const list = (c.data.body || []) as Category[];
    setItems(list);
    setMenus(m.data.body || []);
    setExpanded(new Set(list.map((x) => x.id)));
    if (!form.menu_id && m.data.body?.[0]?.id) {
      setForm((f) => ({ ...f, menu_id: m.data.body[0].id }));
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const tree = useMemo(() => buildTree(items), [items]);

  function expandAll() {
    setExpanded(new Set(items.map((x) => x.id)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  function startRoot() {
    setMode('root');
    setForm({ name: '', slug: '', menu_id: menus[0]?.id || '', is_active: true });
  }

  function startSub() {
    setMode('sub');
    setForm({ name: '', slug: '', menu_id: menus[0]?.id || '', is_active: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'sub' && !selectedId) {
      alert('Select a parent category first');
      return;
    }
    setSaving(true);
    try {
      const parent = mode === 'sub' ? items.find((x) => x.id === selectedId) : null;
      await api.post('/categories', {
        name: form.name,
        slug: form.slug || undefined,
        menu_id: parent?.menuId || form.menu_id,
        parent_id: mode === 'sub' ? selectedId : null,
        is_active: form.is_active,
      });
      setForm({ name: '', slug: '', menu_id: form.menu_id, is_active: true });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Categories</h1>
        </div>
        <div className="text-sm text-muted">Home &gt; Categories</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={startRoot}>
              <Plus className="h-4 w-4" /> Add Root Category
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white"
              onClick={startSub}
            >
              <Plus className="h-4 w-4" /> Add Sub Category
            </button>
          </div>
          <div className="mb-3 flex gap-4 text-sm">
            <button type="button" className="text-plum hover:underline" onClick={expandAll}>
              Expand All
            </button>
            <button type="button" className="text-plum hover:underline" onClick={collapseAll}>
              Collapse All
            </button>
          </div>
          <div className="min-h-[280px] rounded-xl border border-border p-2">
            {tree.length === 0 ? (
              <p className="p-4 text-sm text-muted">No categories yet. Create a root category.</p>
            ) : (
              tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={(id) =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{mode === 'root' ? 'Create Root Category' : 'Create Sub Category'}</h2>
            <button type="submit" form="category-form" className={btnPrimary} disabled={saving}>
              <Plus className="h-4 w-4" /> Create
            </button>
          </div>
          <form id="category-form" onSubmit={onSubmit} className="space-y-3">
            {mode === 'root' ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Menu</label>
                <select
                  className={fieldClass}
                  required
                  value={form.menu_id}
                  onChange={(e) => setForm({ ...form, menu_id: e.target.value })}
                >
                  <option value="">Select menu</option>
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {labelOf(m.name)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-muted">
                Parent: {selectedId ? labelOf(items.find((x) => x.id === selectedId)?.name) : 'Select a category in the tree'}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Name (English)</label>
              <input
                className={fieldClass}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input
                className={fieldClass}
                placeholder="auto-generated if empty"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Logo</label>
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-muted">
                <ImageIcon className="h-8 w-8" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
          </form>
        </Card>
      </div>
    </div>
  );
}
