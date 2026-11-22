'use client';
import { Children, useState } from 'react';

export default function ShowMore({ children, max = 3 }: { children: React.ReactNode; max?: number }) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  if (items.length <= max) return <>{children}</>;
  return (
    <div className="space-y-2">
      {items.slice(0, max)}
      {!open && (
        <div className="relative">
          <div style={{ filter: 'blur(3px)', opacity: 0.55, pointerEvents: 'none' }}>
            {items.slice(max, Math.min(max + 1, items.length))}
          </div>
          <button onClick={() => setOpen(true)}
            className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
            style={{ color: 'var(--primary)' }}>
            Show {items.length - max} more
          </button>
        </div>
      )}
      {open && items.slice(max)}
      {open && (
        <button onClick={() => setOpen(false)} className="text-xs font-semibold" style={{ color: 'var(--fg3)' }}>
          Show less
        </button>
      )}
    </div>
  );
}
