import { notFound } from 'next/navigation';
import { requireUserOrRedirect } from '../../../lib/guard';
import { getProduct } from '../../../db/queries';
import { applyUserPriceToProduct } from '../../../lib/services/pricing';
import { resolvePromo, priceBreakdown, nextPromoTeaser } from '../../../lib/services/promo';
import BuyPanel from './BuyPanel';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const user = await requireUserOrRedirect();
  const raw = await getProduct(Number(params.id));
  if (!raw || !raw.active) notFound();
  const p = await applyUserPriceToProduct(user.telegram_id, raw);
  const promo = await resolvePromo(user.telegram_id, p.id, 1, p.price);
  const teaser = await nextPromoTeaser(user.telegram_id, p.id, 1, p.price);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-3xl mb-1">{p.emoji && p.emoji !== '🛒' ? p.emoji : '🛒'}</div>
        <h1 className="text-xl font-bold">{p.name}</h1>
        {p.description && <p className="text-slate-300 mt-2 whitespace-pre-wrap">{p.description}</p>}
        {p.warranty && <p className="text-xs text-amber-300/80 mt-2">🛡 {p.warranty}</p>}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-brand font-bold text-lg">${p.price.toFixed(2)}</span>
          <span className="text-slate-400">
            {p.unlimited_stock ? 'Unlimited stock' : p.stock > 0 ? `${p.stock} in stock` : 'Out of stock — pre-order available'}
          </span>
        </div>
      </div>
      {promo && (
        <div className="card border-brand/50 text-sm">
          🎉 Promo <b>{promo.promo.name}</b> applied — for ${promo.discount.toFixed(2)} off.
        </div>
      )}
      {teaser && (
        <div className="text-xs text-slate-400">
          Tip: buy {teaser.min_qty}+ to save ${Number(teaser.discount_amount).toFixed(2)}.
        </div>
      )}
      <BuyPanel
        productId={p.id}
        unitPrice={p.price}
        maxQty={p.unlimited_stock ? 100 : Math.max(p.stock, 1)}
        balance={user.balance}
      />
    </div>
  );
}
