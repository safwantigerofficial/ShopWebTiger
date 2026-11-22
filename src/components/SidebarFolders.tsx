'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import CE from './CE';
import type { Bucket } from '../lib/buckets';

export default function SidebarFolders() {
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const params = useSearchParams();
  const path = usePathname();
  const active = params.get('b');

  useEffect(() => {
    let live = true;
    fetch('/api/buckets')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setBuckets(d?.buckets ?? []))
      .catch(() => {});
    return () => { live = false; };
  }, []);

  // Folders belong to the shop only — hide on other pages.
  if (!buckets || buckets.length === 0 || !path.startsWith('/shop')) return null;

  return (
    <div className="mt-3 px-3 flex-1 min-h-0 flex flex-col">
      <div className="px-3 pb-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--fg3)' }}>
        Folders
      </div>
      <nav className="space-y-0 overflow-y-auto flex-1 min-h-0 pb-3">
        <Link href="/shop"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          style={{ color: !active ? 'var(--primary)' : 'var(--fg2)', background: !active ? 'var(--primary-soft)' : 'transparent' }}>
          <CE id="5861517687632433327" size={14} />
          All products
        </Link>
        {buckets.map((b) => {
          const on = active === b.label;
          return (
            <Link key={b.key} href={`/shop?b=${encodeURIComponent(b.label)}`}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{ color: on ? 'var(--primary)' : 'var(--fg2)', background: on ? 'var(--primary-soft)' : 'transparent' }}>
              {b.emojiId ? <CE id={b.emojiId} size={14} /> : b.emoji ? <span className="w-[15px] text-center text-[13px]">{b.emoji}</span> : <span className="w-[15px]" />}
              <span className="flex-1 truncate">{b.label}</span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--fg3)' }}>{b.count}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
