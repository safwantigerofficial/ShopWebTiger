'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CE from './CE';
import type { Bucket } from '../lib/buckets';

export default function SidebarFolders() {
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const params = useSearchParams();
  const active = params.get('b');

  useEffect(() => {
    let live = true;
    fetch('/api/buckets')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setBuckets(d?.buckets ?? []))
      .catch(() => {});
    return () => { live = false; };
  }, []);

  if (!buckets || buckets.length === 0) return null;

  return (
    <div className="mt-5 px-3">
      <div className="px-3 pb-2 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--fg3)' }}>
        Folders
      </div>
      <nav className="space-y-0.5">
        <Link href="/shop"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition"
          style={{ color: !active ? 'var(--primary)' : 'var(--fg2)', background: !active ? 'rgba(37,99,235,.09)' : 'transparent' }}>
          <span className="w-4 h-4 rounded-sm border" style={{ borderColor: 'var(--primary)' }} />
          All products
        </Link>
        {buckets.map((b) => {
          const on = active === b.label;
          return (
            <Link key={b.key} href={`/shop?b=${encodeURIComponent(b.label)}`}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ color: on ? 'var(--primary)' : 'var(--fg2)', background: on ? 'rgba(37,99,235,.09)' : 'transparent' }}>
              {b.emojiId ? <CE id={b.emojiId} size={18} /> : b.emoji ? <span className="w-[18px] text-center">{b.emoji}</span> : <span className="w-[18px]" />}
              <span className="flex-1 truncate">{b.label}</span>
              <span className="text-[11px] font-normal" style={{ color: 'var(--fg3)' }}>{b.count}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
