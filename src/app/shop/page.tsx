import Link from 'next/link';
import { requireUserOrRedirect } from '../../lib/guard';
import { listCategories, listProducts } from '../../db/queries';
import { applyUserPriceToProducts } from '../../lib/services/pricing';

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
      {visible.map((s) => (
        <section key={s.category.id}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">{s.category.name}</h2>
            <span className="chip chip-grey">{s.products.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.products.map((p) => {
              const out = !p.unlimited_stock && p.stock <= 0;
              return (
                <Link key={p.id} href={`/product/${p.id}`} className="card card-hover block">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-night-700 border border-night-500 flex items-center justify-center text-xl shrink-0">
                      {p.emoji && p.emoji !== '🛒' ? p.emoji : '🛒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold leading-snug">{p.name}</div>
                      {p.description && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</div>}
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
