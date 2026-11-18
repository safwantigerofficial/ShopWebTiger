'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DBCategory, DBProduct } from '../../types';

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
    <div className="mt-6">
      <div className="relative sm:max-w-sm ml-auto">
        <input
          className="input !py-3 pr-10 text-[15px]"
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <svg className="absolute right-3.5 top-1/2 -translate-y-1/2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </div>

      <div className="flex items-center justify-between mt-6 mb-4">
        <span className="text-[15px]" style={{ color: 'var(--fg2)' }}>
          {products.length} product{products.length === 1 ? '' : 's'}
        </span>
        <label className="flex items-center gap-2 text-[15px] select-none" style={{ color: 'var(--fg2)' }}>
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
            className="w-4 h-4 accent-blue-600" />
          In stock only
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => {
          const out = !p.unlimited_stock && p.stock <= 0;
          return (
            <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
              className="card card-hover !p-0 overflow-hidden block group">
              {/* media tile */}
              <div className="relative h-28 flex items-center justify-center text-4xl"
                style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {p.emoji || '🛒'}
                <span className={`chip text-[11px] absolute top-2 right-2 ${out ? 'stock-out' : 'stock-ok'}`}>
                  {out ? 'Out of stock' : p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
                </span>
              </div>
              <div className="p-3.5">
                <div className="font-semibold text-[15px] leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-blue-600 transition">
                  {p.name}
                </div>
                {p.warranty && (
                  <div className="text-xs mt-1 line-clamp-1" title={p.warranty} style={{ color: 'var(--fg3)' }}>
                    {p.warranty}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold">${p.price.toFixed(2)}</span>
                  <span className="btn-primary !py-1.5 !px-3.5 !text-sm pointer-events-none">
                    Buy
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
