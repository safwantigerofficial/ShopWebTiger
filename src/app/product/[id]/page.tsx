import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUserOrRedirect } from '../../../lib/guard';
import { getProduct, listPaymentMethods } from '../../../db/queries';
import ProductIcon from '../../../components/ProductIcon';
import { ceText } from '../../../lib/premiumEmoji';
import CEText from '../../../components/CEText';
import { applyUserPriceToProduct } from '../../../lib/services/pricing';
import { resolvePromo, nextPromoTeaser } from '../../../lib/services/promo';
import BuyPanel from './BuyPanel';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const user = await requireUserOrRedirect();
  const raw = await getProduct(Number(params.id));
  if (!raw || !raw.active) notFound();
  const p = await applyUserPriceToProduct(user.telegram_id, raw);
  const promo = await resolvePromo(user.telegram_id, p.id, 1, p.price);
  const teaser = await nextPromoTeaser(user.telegram_id, p.id, 1, p.price);
  const methods = await listPaymentMethods();
  const out = !p.unlimited_stock && p.stock <= 0;

  return (
    <div>
      <Link href="/shop" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--fg2)' }}>
        ← Back
      </Link>

      <div className="grid lg:grid-cols-2 gap-5 mt-4">
        {/* Left — media + details */}
        <div className="space-y-5">
          <div className="card !p-0 overflow-hidden">
            <div className="h-56 flex items-center justify-center"
              style={{ background: 'var(--surface2)' }}>
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={52} />
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="font-bold text-lg">View product</h2>
            {p.warranty && (
              <div className="mt-3">
                <div className="text-xs font-semibold" style={{ color: 'var(--fg3)' }}>WARRANTY</div>
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed mt-1" style={{ color: 'var(--fg2)' }}>
                  <CEText text={p.warranty} />
                </div>
              </div>
            )}
            {p.description && (
              <div className="mt-4">
                <div className="text-xs font-semibold" style={{ color: 'var(--fg3)' }}>DESCRIPTION</div>
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed mt-1" style={{ color: 'var(--fg2)' }}>
                  <CEText text={p.description} />
                </div>
              </div>
            )}
            {p.tutorial_text && (
              <div className="mt-4">
                <div className="text-xs font-semibold" style={{ color: 'var(--fg3)' }}>NOTE</div>
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed mt-1" style={{ color: 'var(--fg2)' }}>
                  <CEText text={p.tutorial_text} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — buy box */}
        <div>
          <div className="card !p-6">
            <div className="flex justify-end">
              {out ? (
                <span className="chip stock-out">Out of stock</span>
              ) : (
                <span className="chip stock-ok">
                  ● {p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2"><CEText text={p.name} size={24} /></h1>
            <div className="text-3xl font-extrabold mt-3">${p.price.toFixed(2)}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--fg2)' }}>per unit</div>
            <div className="text-sm mt-4 flex items-center gap-2" style={{ color: 'var(--fg2)' }}>
              📎 Your delivery will be available in My orders.
            </div>
            {promo && (
              <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(22,163,106,.1)', border: '1px solid rgba(22,163,106,.3)' }}>
                🎉 Promo <b>{promo.promo.name}</b> applied — ${promo.discount.toFixed(2)} off.
              </div>
            )}
            {teaser && (
              <div className="text-xs mt-2" style={{ color: 'var(--fg3)' }}>
                Tip: buy {teaser.min_qty}+ to save ${Number(teaser.discount_amount).toFixed(2)}.
              </div>
            )}
            <div className="mt-5">
              <BuyPanel
                productId={p.id}
                unitPrice={p.price}
                maxQty={p.unlimited_stock ? 100 : Math.max(p.stock, 1)}
                balance={user.balance}
                productName={p.name}
                methods={methods}
              />
            </div>
            <div className="text-xs mt-3" style={{ color: 'var(--fg3)' }}>
              Price and availability are checked again before ordering.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
