'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DBCategory, DBProduct } from '../../types';
import ProductIcon from '../../components/ProductIcon';
import { ceText } from '../../lib/premiumEmoji';

type Section = { category: DBCategory; products: DBProduct[] };

export default function ShopGrid({
  sections,
  total: _total,
  loggedIn,
}: {
  sections: Section[];
  total: number;
  loggedIn: boolean;
}) {
  const [q, setQ] = useState('');
  const [inStock, setInStock] = useState(false);

  const products = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sections
      .flatMap((s) => s.products)
      .filter(
        (p) =>
          (!needle || p.name.toLowerCase().includes(needle)) &&
          (!inStock || p.unlimited_stock || p.stock > 0),
      );
  }, [sections, q, inStock]);

  return (
    <div className="mt-5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
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
                    <span className="chip stock-out text-xs">Out of stock</span>
                  ) : (
                    <span className="chip stock-ok text-xs">
                      ● {p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
                    </span>
                  )}
                </div>
                <div className="mt-3 font-bold text-[15px] leading-snug" style={{ color: 'var(--fg)' }}>
                  {ceText(p.name)}
                </div>
                {p.warranty && (
                  <div className="text-xs mt-1 line-clamp-1" title={p.warranty} style={{ color: 'var(--fg3)' }}>
                    {ceText(p.warranty)}
                  </div>
                )}
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
