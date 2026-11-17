'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Product = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  price: number;
  stock: number;
  unlimited_stock: boolean;
};
type Section = { category: { id: string; name: string }; products: Product[] };

export default function ShopGrid({ sections }: { sections: Section[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sections
      .filter((s) => cat === 'all' || s.category.id === cat)
      .map((s) => ({
        ...s,
        products: s.products.filter((p) => !needle || p.name.toLowerCase().includes(needle)),
      }))
      .filter((s) => s.products.length > 0);
  }, [sections, q, cat]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          className="input sm:max-w-xs"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            className={`chip !px-3.5 !py-1.5 ${cat === 'all' ? 'chip-green' : 'chip-grey'}`}
            onClick={() => setCat('all')}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s.category.id}
              className={`chip !px-3.5 !py-1.5 whitespace-nowrap ${cat === s.category.id ? 'chip-green' : 'chip-grey'}`}
              onClick={() => setCat(s.category.id)}
            >
              {s.category.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p style={{ color: 'var(--fg2)' }}>No products match.</p>}

      {filtered.map((s) => (
        <section key={s.category.id}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">{s.category.name}</h2>
            <span className="chip chip-grey">{s.products.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.products.map((p) => {
              const out = !p.unlimited_stock && p.stock <= 0;
              return (
                <Link key={p.id} href={`/product/${p.id}`} className="card card-hover block">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                      {p.emoji && p.emoji !== '🛒' ? p.emoji : '🛒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold leading-snug">{p.name}</div>
                      {p.description && <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--fg2)' }}>{p.description}</div>}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="chip chip-green">${p.price.toFixed(2)}</span>
                        <span className={`chip ${out ? 'chip-red' : p.unlimited_stock ? 'chip-grey' : 'chip-amber'}`}>
                          {p.unlimited_stock ? 'In stock' : out ? 'Out of stock' : `${p.stock} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
