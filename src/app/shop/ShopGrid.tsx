'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DBCategory, DBProduct } from '../../types';

type Section = { category: DBCategory; products: DBProduct[] };

export default function ShopGrid({
  sections,
  total,
  loggedIn,
}: {
  sections: Section[];
  total: number;
  loggedIn: boolean;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [inStock, setInStock] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sections
      .filter((s) => cat === 'all' || String(s.category.id) === cat)
      .flatMap((s) => s.products)
      .filter(
        (p) =>
          (!needle || p.name.toLowerCase().includes(needle)) &&
          (!inStock || p.unlimited_stock || p.stock > 0),
      );
  }, [sections, q, cat, inStock]);

  return (
    <div className="mt-6">
      <div className="relative sm:max-w-sm ml-auto">
        <input
          className="input !py-2.5 pr-9 text-sm"
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--fg2)' }}>Folders</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCat('all')}
            className={`chip !px-4 !py-2 whitespace-nowrap !text-[13px] ${cat === 'all' ? 'chip-active' : 'chip-grey'}`}>
            All products
          </button>
          {sections.map((s) => (
            <button key={s.category.id} onClick={() => setCat(String(s.category.id))}
              className={`chip !px-4 !py-2 whitespace-nowrap !text-[13px] ${cat === String(s.category.id) ? 'chip-active' : 'chip-grey'}`}>
              🗂️ {s.category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <span className="text-sm" style={{ color: 'var(--fg2)' }}>
          {filtered.length} product{filtered.length === 1 ? '' : 's'}
        </span>
        <label className="flex items-center gap-2 text-sm select-none" style={{ color: 'var(--fg2)' }}>
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
            className="w-4 h-4 accent-blue-600" />
          In stock only
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const out = !p.unlimited_stock && p.stock <= 0;
          return (
            <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
              className="card card-hover !p-5 block group">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  {p.emoji || '🛒'}
                </div>
                {out ? (
                  <span className="chip stock-out text-xs">Out of stock</span>
                ) : (
                  <span className="chip stock-ok text-xs">
                    ● {p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
                  </span>
                )}
              </div>
              <div className="mt-3 font-bold text-[15px] leading-snug group-hover:text-blue-600 transition"
                style={{ color: 'var(--fg)' }}>
                {p.name}
              </div>
              {p.warranty && (
                <div className="text-xs mt-1" style={{ color: 'var(--fg3)' }}>{p.warranty}</div>
              )}
              <div className="text-sm mt-3" style={{ color: 'var(--fg2)' }}>per unit</div>
              <div className="text-xl font-extrabold mt-0.5" style={{ color: 'var(--fg)' }}>
                ${p.price.toFixed(2)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
