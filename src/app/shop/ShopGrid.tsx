'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DBCategory, DBProduct } from '../../types';
import ProductIcon from '../../components/ProductIcon';
import { ceText } from '../../lib/premiumEmoji';
import CE from '../../components/CE';

type Section = { category: DBCategory; products: DBProduct[] };

export default function ShopGrid({
  sections,
  buckets,
  total: _total,
  loggedIn,
}: {
  sections: Section[];
  buckets: { key: string; label: string; emojiId: string | null; emoji: string | null; keys: string[]; count: number }[];
  total: number;
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

  return (
    <div className="mt-5">
      {/* Browse buckets — horizontally scrollable on mobile */}
      {buckets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setBucket(null)}
            className={`chip shrink-0 !py-2 !px-4 !text-sm ${bucket === null ? 'chip-active' : 'chip-grey'}`}
          >
            All <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface2)' }}>{sections.flatMap((s) => s.products).length}</span>
          </button>
          {buckets.map((b) => (
            <button
              key={b.key}
              onClick={() => setBucket(bucket === b.key ? null : b.key)}
              className={`chip shrink-0 !py-2 !px-4 !text-sm font-semibold ${bucket === b.key ? 'chip-active' : 'chip-grey'}`}
            >
              {b.emojiId ? (
                <span className="mr-1.5"><CE id={b.emojiId} size={16} /></span>
              ) : b.emoji ? (
                <span className="mr-1.5">{b.emoji}</span>
              ) : null}
              {b.label}
              <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface2)' }}>{b.count}</span>
            </button>
          ))}
        </div>
      )}
      {/* Main column */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <span className="text-[15px]" style={{ color: 'var(--fg2)' }}>
            {products.length} product{products.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <input
                className="input !py-2.5 pr-9 text-sm"
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

        {/* Mobile — batman-style list rows */}
        <div className="sm:hidden mt-4 space-y-2">
          {products.map((p) => {
            const out = !p.unlimited_stock && p.stock <= 0;
            return (
              <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
                className="card !py-3 !px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm leading-snug">{ceText(p.name)}</div>
                  {out ? (
                    <span className="chip stock-out !text-[10px] !py-0.5 !px-2 mt-0.5 inline-block">Pre-order</span>
                  ) : (
                    <span className="chip stock-ok !text-[10px] !py-0.5 !px-2 mt-0.5 inline-block">
                      ● {p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
                    </span>
                  )}
                </div>
                <div className="text-base font-extrabold shrink-0">${p.price.toFixed(2)}</div>
              </Link>
            );
          })}
        </div>

        {/* Desktop — card grid */}
        <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {products.map((p) => {
            const out = !p.unlimited_stock && p.stock <= 0;
            return (
              <div key={p.id} className="card !p-5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={32} />
                  </div>
                  {out ? (
                    <span className="chip stock-out text-xs">Pre-order</span>
                  ) : (
                    <span className="chip stock-ok text-xs">
                      ● {p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
                    </span>
                  )}
                </div>
                <div className="mt-3 font-bold text-[15px] leading-snug" style={{ color: 'var(--fg)' }}>
                  {ceText(p.name)}
                </div>
                <div className="text-sm mt-3" style={{ color: 'var(--fg2)' }}>per unit</div>
                <div className="text-xl font-extrabold mt-0.5" style={{ color: 'var(--fg)' }}>
                  ${p.price.toFixed(2)}
                </div>
                <Link href={loggedIn ? `/product/${p.id}` : '/login'} className="btn-ghost w-full mt-4 !py-2.5 text-sm">
                  View product
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
