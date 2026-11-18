import { currentUser } from '../../lib/session';
import { listCategories, listProducts } from '../../db/queries';
import { applyUserPriceToProducts } from '../../lib/services/pricing';
import ShopGrid from './ShopGrid';

export default async function ShopPage() {
  const user = await currentUser();
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
  const visible = sections.filter((s) => s.products.length > 0);
  const total = visible.reduce((n, s) => n + s.products.length, 0);

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
      <ShopGrid sections={JSON.parse(JSON.stringify(visible))} total={total} loggedIn={!!user} />
    </div>
  );
}
