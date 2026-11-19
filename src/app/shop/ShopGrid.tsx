'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DBCategory, DBProduct } from '../../types';
import ProductIcon from '../../components/ProductIcon';
import { ceText } from '../../lib/premiumEmoji';
import CE from '../../components/CE';

type Section = { category: DBCategory; products: DBProduct[] };
type Bucket = { key: string; label: string; emojiId: string | null; emoji: string | null; keys: string[]; count: number };

function bucketIcon(b: Bucket) {
  if (b.emojiId) return <CE id={b.emojiId} size={16} />;
  if (b.emoji) return <span>{b.emoji}</span>;
  return <span className="w-4" />;
}

export default function ShopGrid({
  sections,
  buckets,
  sold,
  loggedIn,
}: {
  sections: Section[];
  buckets: Bucket[];
  sold: Record<number, number>;
  loggedIn: boolean;
}) {
  const [q, setQ] = useState('');
  const [inStock, setInStock] = useState(false);
  const [bucket, setBucket] = useState<string | null>(null);

  const activeKeys = buckets.find((b) => b.key === bucket)?.keys;
  const products = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sections
      .flatMap((s) => s.products)
      .filter(
        (p) =>
          (!activeKeys || activeKeys.some((k) => p.name.toLowerCase().includes(k))) &&
          (!needle || p.name.toLowerCase().includes(needle)) &&
          (!inStock || p.unlimited_stock || p.stock > 0),
      );
  }, [sections, q, inStock, activeKeys]);

  const totalCount = sections.flatMap((s) => s.products).length;

  const stockLine = (p: DBProduct) => {
    const out = !p.unlimited_stock && p.stock <= 0;
    const s = sold[p.id];
    return (
      <span className="text-xs" style={{ color: out ? '#dc2626' : 'var(--ok, #16a36a)' }}>
        ● {out ? 'Pre-order' : p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
        {s != null && s > 0 && <span style={{ color: 'var(--fg3)' }}>&nbsp;&nbsp;{s.toLocaleString()} sold</span>}
      </span>
    );
  };

  const folders = (
    <>
      <button onClick={() => setBucket(null)}
        className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-left transition ${bucket === null ? '' : 'opacity-80 hover:opacity-100'}`}
        style={bucket === null ? { background: 'var(--surface2)', color: 'var(--primary)' } : { color: 'var(--fg2)' }}>
        <span className="w-4 h-4 rounded-sm border" style={{ borderColor: 'var(--primary)', background: 'var(--surface)' }} />
        All products
      </button>
      {buckets.map((b) => (
        <button key={b.key} onClick={() => setBucket(bucket === b.key ? null : b.key)}
          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-left transition ${bucket === b.key ? '' : 'opacity-80 hover:opacity-100'}`}
          style={bucket === b.key ? { background: 'var(--surface2)', color: 'var(--primary)' } : { color: 'var(--fg2)' }}>
          {bucketIcon(b)}
          {b.label}
          <span className="ml-auto text-[11px] font-normal" style={{ color: 'var(--fg3)' }}>{b.count}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="mt-5 lg:flex lg:gap-8">
      {/* Desktop — folders sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--fg3)' }}>Folders</div>
        <nav className="space-y-0.5 sticky top-24">{folders}</nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <span className="text-[15px]" style={{ color: 'var(--fg2)' }}>
            {products.length} product{products.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <input
                className="input !py-2.5 pr-9"
                style={{ fontSize: 16 }}
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q ? (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ color: 'var(--fg3)' }} onClick={() => setQ('')}>
                  Clear
                </button>
              ) : (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap select-none" style={{ color: 'var(--fg2)' }}>
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              In stock only
            </label>
          </div>
        </div>

        {/* Mobile — bucket chips + list rows */}
        <div className="sm:hidden mt-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            <button onClick={() => setBucket(null)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border"
              style={bucket === null
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : { background: 'var(--surface)', color: 'var(--fg2)', borderColor: 'var(--border)' }}>
              All {totalCount}
            </button>
            {buckets.map((b) => (
              <button key={b.key} onClick={() => setBucket(bucket === b.key ? null : b.key)}
                className="shrink-0 flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold border"
                style={bucket === b.key
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : { background: 'var(--surface)', color: 'var(--fg2)', borderColor: 'var(--border)' }}>
                {b.emojiId ? <span className="mr-1.5"><CE id={b.emojiId} size={14} /></span> : b.emoji ? <span className="mr-1.5">{b.emoji}</span> : null}
                {b.label}
                <span className="ml-1.5 opacity-70">{b.count}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {products.map((p) => {
              const out = !p.unlimited_stock && p.stock <= 0;
              return (
                <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
                  className="card !py-3 !px-4 flex items-center gap-3"
                  style={{ borderColor: out ? 'rgba(220,38,38,.45)' : 'rgba(22,163,106,.35)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-snug">{ceText(p.name)}</div>
                    <span className="mt-0.5 inline-block">{stockLine(p)}</span>
                  </div>
                  <div className="text-base font-extrabold shrink-0">${p.price.toFixed(2)}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop — slim card grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
          {products.map((p) => {
            const out = !p.unlimited_stock && p.stock <= 0;
            return (
              <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
                className="card card-hover !p-4 flex flex-col"
                style={{
                  borderColor: out ? 'rgba(220,38,38,.45)' : 'rgba(22,163,106,.35)',
                  background: out ? 'rgba(220,38,38,.04)' : 'rgba(22,163,106,.05)',
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm leading-snug truncate" title={p.name}>{ceText(p.name)}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--fg3)' }}>per unit</div>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  {stockLine(p)}
                  <div className="text-lg font-extrabold shrink-0">${p.price.toFixed(2)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
