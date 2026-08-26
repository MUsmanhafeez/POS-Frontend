'use client';

export default function AdminPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-48 rounded-lg bg-surface-muted" />
        <div className="h-4 w-32 rounded bg-surface-muted" />
      </div>
      <div className="flex justify-end gap-2">
        <div className="h-10 w-64 rounded-xl bg-surface-muted" />
        <div className="h-10 w-10 rounded-xl bg-surface-muted" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-12 border-b border-border bg-surface-muted/50" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border px-4 py-3 last:border-0">
            <div className="h-4 w-8 rounded bg-surface-muted" />
            <div className="h-4 flex-1 rounded bg-surface-muted" />
            <div className="h-4 w-24 rounded bg-surface-muted" />
            <div className="h-4 w-20 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
