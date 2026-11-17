import { requireUserOrRedirect } from '../../lib/guard';
import { listCategories, listProducts } from '../../db/queries';
import { applyUserPriceToProducts } from '../../lib/services/pricing';
import ShopGrid from './ShopGrid';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const user = await requireUserOrRedirect();
  const categories = await listCategories();
  const sections = await Promise.all(
    categories.map(async (c) => {
      const { rows } = await listProducts(c.id, 0, 100);
      return { category: c, products: await applyUserPriceToProducts(user.telegram_id, rows) };
    }),
  );
  const visible = sections.filter((s) => s.products.length > 0);

  return (
    <div className="space-y-8">
      <section className="pt-2 pb-1">
        <p className="text-xs uppercase tracking-[0.2em] text-brand font-semibold">Digital goods store</p>
        <h1 className="serif text-3xl sm:text-4xl font-medium mt-1">Shop</h1>
        <p className="text-sm text-slate-400 mt-1">
          Instant delivery after payment · Balance <b className="text-brand">${user.balance.toFixed(2)}</b>
        </p>
      </section>
      {visible.length === 0 && <p className="text-slate-400">No products available right now.</p>}
      <ShopGrid sections={JSON.parse(JSON.stringify(visible))} />
    </div>
  );
}
