import { currentUser } from '../../lib/session';
import { listCategories, listProducts } from '../../db/queries';
import type { DBCategory } from '../../types';
import { applyUserPriceToProducts } from '../../lib/services/pricing';
import Link from 'next/link';
import ProductIcon from '../../components/ProductIcon';
import ShopGrid from './ShopGrid';

export default async function ShopPage() {
  const user = await currentUser();
  const loggedIn = !!user;
  const categories = await listCategories();
  const sections = await Promise.all(
    categories.map(async (c) => {
      const { rows } = await listProducts(c.id, 0, 500);
      return {
        category: c,
        products: user ? await applyUserPriceToProducts(user.telegram_id, rows) : rows,
      };
    }),
  );
  // Same global order as the bot shop: pinned → in-stock → sort_order → id.
  const flat = sections
    .flatMap((s) => s.products)
    .sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1;
      const aIn = a.unlimited_stock || a.stock > 0;
      const bIn = b.unlimited_stock || b.stock > 0;
      if (aIn !== bIn) return aIn ? -1 : 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  const visible = sections.filter((s) => s.products.length > 0);
  if (flat.length > 0) {
    visible.length = 0;
    visible.push({ category: categories[0] ?? ({} as DBCategory), products: flat });
  }
  const total = visible.reduce((n, s) => n + s.products.length, 0);
  // Newest products by id — the web equivalent of the bot's
  // "new stock added" announcements.
  const arrivals = [...flat].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <div>
      <div className="text-sm font-semibold" style={{ color: 'var(--fg2)' }}>SafwanTiger</div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">The shop</h1>
          <p className="mt-1.5 text-[15px]" style={{ color: 'var(--fg2)' }}>
            Your favourite tools, in one place.
          </p>
        </div>
      </div>
      {visible.length === 0 && <p className="mt-8" style={{ color: 'var(--fg2)' }}>No products available right now.</p>}

      {arrivals.length > 0 && (
        <div className="mt-5">
          <div className="text-sm font-bold" style={{ color: 'var(--fg)' }}>New arrivals</div>
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2 -mx-1 px-1">
            {arrivals.map((p) => (
              <Link key={p.id} href={loggedIn ? `/product/${p.id}` : '/login'}
                className="card card-hover !py-3 !px-4 flex items-center gap-3 shrink-0 min-w-[220px]">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={24} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--primary)' }}>${p.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ShopGrid sections={JSON.parse(JSON.stringify(visible))} total={total} loggedIn={loggedIn} />
    </div>
  );
}
