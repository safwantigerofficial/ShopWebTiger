import { currentUser } from '../../lib/session';
import { getProductSales, listCategories, listProducts } from '../../db/queries';
import type { DBCategory } from '../../types';
import { applyUserPriceToProducts } from '../../lib/services/pricing';
import ShopGrid from './ShopGrid';
import { buildBuckets } from '../../lib/buckets';

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
  const sales = await getProductSales(500).catch(() => []);
  const sold = Object.fromEntries(sales.filter((s) => s.product_id != null).map((s) => [s.product_id!, s.units_sold]));
  const visible = sections.filter((s) => s.products.length > 0);
  if (flat.length > 0) {
    visible.length = 0;
    visible.push({ category: categories[0] ?? ({} as DBCategory), products: flat });
  }
  const buckets = buildBuckets(flat);

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

      <ShopGrid
        sections={JSON.parse(JSON.stringify(visible))}
        buckets={buckets}
        sold={sold}
        loggedIn={loggedIn}
      />
    </div>
  );
}
