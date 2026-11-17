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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🛍 Shop</h1>
        <span className="text-sm text-slate-400">Balance: <b className="text-brand">${user.balance.toFixed(2)}</b></span>
      </header>
      {visible.length === 0 && <p className="text-slate-400">No products available right now.</p>}
      {visible.map((s) => (
        <section key={s.category.id}>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {s.category.name}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.products.map((p) => {
              const out = !p.unlimited_stock && p.stock <= 0;
              return (
                <Link key={p.id} href={`/product/${p.id}`} className="card hover:border-brand transition block">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{p.emoji && p.emoji !== '🛒' ? `${p.emoji} ` : ''}{p.name}</div>
                      {p.description && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-brand font-bold">${p.price.toFixed(2)}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.unlimited_stock ? 'Unlimited' : out ? 'Out of stock' : `${p.stock} left`}
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
