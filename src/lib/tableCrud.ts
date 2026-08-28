export { confirmRowDelete } from '@/components/admin/RowActionsMenu';

export function rowLabel(row: Record<string, unknown>, fallback = 'this item'): string {
  const name = row.name;
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object' && 'en' in (name as object)) {
    return String((name as { en?: string }).en || fallback);
  }
  return String(row.code || row.title || row.key || fallback);
}
