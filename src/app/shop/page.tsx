import { currentUser } from '../../lib/session';
import { getAllSettings, listCategories, listProducts } from '../../db/queries';
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
  // Same button-color rule as the bot shop: product override →
  // category color → category default → global in_stock color
  // (out-of-stock always uses the OOS warning color).
  const settings = await getAllSettings().catch(() => new Map<string, unknown>());
  const MODES = new Set(['none', 'blue', 'green', 'red', 'yellow']);
  const modeOf = (k: string) => {
    const v = settings.get(k);
    return typeof v === 'string' && MODES.has(v) ? (v as string) : undefined;
  };
  // Only explicit bot colors tint cards: product override → category color →
  // category default. Out-of-stock = red. In-stock default = neutral (no tint).
  const oosColor = modeOf('color.out_of_stock') ?? 'red';
  const catDefault = modeOf('color.category.default');
  const tintOf = (p: (typeof flat)[number]): string => {
    const inStock = p.unlimited_stock || p.stock > 0;
    if (!inStock) return oosColor;
    return (
      modeOf(`color.product.${p.id}`) ??
      (p.category_id != null ? modeOf(`color.category.${p.category_id}`) : undefined) ??
      catDefault
    );
  };
  const tints = Object.fromEntries(flat.map((p) => [p.id, tintOf(p)]));
  const visible = sections.filter((s) => s.products.length > 0);
  if (flat.length > 0) {
    visible.length = 0;
    visible.push({ category: categories[0] ?? ({} as DBCategory), products: flat });
  }
  const buckets = buildBuckets(flat);

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">The shop</h1>
      {visible.length === 0 && <p className="mt-8" style={{ color: 'var(--fg2)' }}>No products available right now.</p>}

      <ShopGrid
        sections={JSON.parse(JSON.stringify(visible))}
        buckets={buckets}
        tints={tints}
        loggedIn={loggedIn}
      />
    </div>
  );
}
