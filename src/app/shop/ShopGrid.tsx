'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DBCategory, DBProduct } from '../../types';
import ProductIcon from '../../components/ProductIcon';
import { ceText } from '../../lib/premiumEmoji';
import CE from '../../components/CE';

type Section = { category: DBCategory; products: DBProduct[] };
type Bucket = { key: string; label: string; emojiId: string | null; emoji: string | null; keys: string[]; count: number };

const TINTS: Record<string, string | undefined> = {
  green: '#16a36a',
  red: '#dc2626',
  blue: '#4f46e5',
  yellow: '#d97706',
};

export default function ShopGrid({
  sections,
  buckets,
  tints,
  loggedIn,
}: {
  sections: Section[];
  buckets: Bucket[];
  tints: Record<number, string | undefined>;
  loggedIn: boolean;
}) {
  const [q, setQ] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<'default' | 'low' | 'high' | 'name'>('default');
  const params = useSearchParams();
  const [bucket, setBucketState] = useState<string | null>(params.get('b'));
  // Sidebar folder links drive ?b=…; keep chip taps in the URL too.
  useEffect(() => setBucketState(params.get('b')), [params]);
  const setBucket = (b: string | null) => {
    setBucketState(b);
    window.history.pushState(null, '', b ? `/shop?b=${encodeURIComponent(b)}` : '/shop');
  };

  const activeKeys = buckets.find((b) => b.key === bucket)?.keys;
  const products = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = sections
      .flatMap((s) => s.products)
      .filter(
        (p) =>
          (!activeKeys || activeKeys.some((k) => p.name.toLowerCase().includes(k))) &&
          (!needle || p.name.toLowerCase().includes(needle)) &&
          (!inStock || p.unlimited_stock || p.stock > 0),
      );
    const list = [...filtered];
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'high') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [sections, q, inStock, activeKeys, sort]);

  const totalCount = sections.flatMap((s) => s.products).length;

  const stockLine = (p: DBProduct) => {
    const out = !p.unlimited_stock && p.stock <= 0;
    const low = !out && !p.unlimited_stock && p.stock <= 5;
    return (
      <span className="text-xs font-medium" style={{ color: out ? '#dc2626' : low ? '#ea7a12' : 'var(--ok, #16a36a)' }}>
        ● {out ? 'Pre-order' : p.unlimited_stock ? 'In stock' : low ? `Only ${p.stock} left` : `${p.stock} in stock`}
      </span>
    );
  };

  const cardStyle = (p: DBProduct) => {
    const c = TINTS[tints[p.id] ?? ''];
    return c ? { borderColor: `${c}80`, boxShadow: `inset 2px 0 0 ${c}` } : undefined;
  };

  return (
    <div className="mt-3 sm:mt-5">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between">
          <span className="hidden sm:inline text-[15px]" style={{ color: 'var(--fg2)' }}>
            {products.length} product{products.length === 1 ? '' : 's'}
          </span>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
            <div className="relative w-full sm:w-64">
              <input
                className="input !py-2 pr-9"
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
            <select className="input !w-auto flex-1 sm:flex-none !py-2 !pr-8 !text-sm shrink-0" value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
              <option value="default">Featured</option>
              <option value="low">Price: low → high</option>
              <option value="high">Price: high → low</option>
              <option value="name">Name A–Z</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap select-none" style={{ color: 'var(--fg2)' }}>
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
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
              <span className="mr-1"><CE id="5861517687632433327" size={14} /></span>All {totalCount}
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
          <div className="mt-3 space-y-1.5">
            {products.map((p) => {
              const out = !p.unlimited_stock && p.stock <= 0;
              return (
                <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
                  className="card !py-2 !px-2.5 flex items-center gap-2 !rounded-2xl"
                  style={cardStyle(p)}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] leading-snug">{ceText(p.name)}</div>
                    <span className="mt-0.5 inline-block">{stockLine(p)}</span>
                  </div>
                  <div className="text-sm font-extrabold shrink-0">${p.price.toFixed(2)}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop — slim card grid */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 mt-4">
          {products.map((p) => (
            <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
              className="group card card-hover !p-2.5 flex flex-col"
              style={cardStyle(p)}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={20} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm leading-snug truncate" title={p.name}>{ceText(p.name)}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--fg3)' }}>per unit</div>
                </div>
              </div>
              <div className="mt-2.5 flex items-end justify-between gap-2">
                {stockLine(p)}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-[15px] font-extrabold">${p.price.toFixed(2)}</div>
                  <span className="text-base font-bold opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition"
                    style={{ color: 'var(--primary)' }}>›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
