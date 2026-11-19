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

      <div className="grid lg:grid-cols-2 gap-5 mt-4">
        {/* Media — top on mobile, left column on desktop */}
        <div className="card !p-0 overflow-hidden h-fit">
          <div className="h-28 lg:h-56 flex items-center justify-center"
            style={{ background: 'var(--surface2)' }}>
            <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl flex items-center justify-center text-3xl lg:text-5xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <ProductIcon emojiId={p.emoji_id} emoji={p.emoji} size={40} />
            </div>
          </div>
        </div>

        {/* Buy box — second on mobile, right column on desktop */}
        <div className="lg:row-span-2">
          <div className="card !p-6">
            <div className="flex justify-end">
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
            <h1 className="text-2xl font-extrabold tracking-tight mt-2"><CEText text={p.name} size={24} /></h1>
            <div className="text-3xl font-extrabold mt-3">${p.price.toFixed(2)}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--fg2)' }}>per unit</div>
            <div className="text-sm mt-4 flex items-center gap-2" style={{ color: 'var(--fg2)' }}>
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
            <div className="mt-5">
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

        {/* Details — below buy box on mobile, under media on desktop */}
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
      </div>
    </div>
  );
}
