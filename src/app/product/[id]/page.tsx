import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUserOrRedirect } from '../../../lib/guard';
import { getProduct } from '../../../db/queries';
import ProductIcon from '../../../components/ProductIcon';
import { ceText } from '../../../lib/premiumEmoji';
import CEText from '../../../components/CEText';
import CE from '../../../components/CE';
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
  const out = !p.unlimited_stock && p.stock <= 0;

  return (
    <div className="pb-24 sm:pb-0">
      <Link href="/shop" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--fg2)' }}>
        ← Back
      </Link>

      {/* Header card — icon + name + price + stock, full width */}
      <div className="card !py-5 !px-5 mt-4 flex items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={34} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug"><CEText text={p.name} size={22} /></h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-2xl font-extrabold">${p.price.toFixed(2)}</span>
            <span className="text-sm" style={{ color: 'var(--fg3)' }}>per unit</span>
            {out ? (
              <span className="chip" style={{ background: 'rgba(234,179,8,.15)', color: '#a16207', border: '1px solid rgba(234,179,8,.4)' }}>
                <CE id="4990412201614378299" size={12} /> Pre-order
              </span>
            ) : (
              <span className="chip stock-ok">
                ● {p.unlimited_stock ? 'In stock' : `${p.stock} in stock`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        {/* Details — left column */}
        <div className="card order-2 lg:order-1">
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
          {p.note && (
            <div className="mt-4">
              <div className="text-xs font-semibold" style={{ color: 'var(--fg3)' }}>NOTE</div>
              <div className="text-[15px] whitespace-pre-wrap leading-relaxed mt-1" style={{ color: 'var(--fg2)' }}>
                <CEText text={p.note} />
              </div>
            </div>
          )}
          {p.note_file_id && (
            <a href={`/api/tgfile?file=${encodeURIComponent(p.note_file_id)}&name=${encodeURIComponent(p.note_file_name ?? 'note')}`}
              className="btn-ghost w-full mt-3 text-sm">
              <CE id="5794085322400733645" /> Download {p.note_file_name ?? 'note file'}
            </a>
          )}
        </div>

        {/* Buy box — right column, sticky on desktop */}
        <div className="order-1 lg:order-2">
          <div className="card !p-6 lg:sticky lg:top-24 h-fit">
            <div className="text-sm flex items-center gap-2" style={{ color: 'var(--fg2)' }}>
              <CE id="5794085322400733645" /> Your delivery will be available in My orders.
            </div>
            {promo && (
              <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(22,163,106,.1)', border: '1px solid rgba(22,163,106,.3)' }}>
                <CE id="5854985398857503237" /> Promo <b>{promo.promo.name}</b> applied — ${promo.discount.toFixed(2)} off.
              </div>
            )}
            {teaser && (
              <div className="text-xs mt-2" style={{ color: 'var(--fg3)' }}>
                Tip: buy {teaser.min_qty}+ to save ${Number(teaser.discount_amount).toFixed(2)}.
              </div>
            )}
            <div className="mt-4">
              <BuyPanel
                productId={p.id}
                unitPrice={p.price}
                maxQty={p.unlimited_stock || out ? 100 : Math.max(p.stock, 1)}
                preorder={out}
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
