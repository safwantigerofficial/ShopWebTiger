'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/session';
import {
  getProduct,
  createOrder,
  setOrderDeliveredItems,
  claimProductItems,
  decrementProductStock,
  countReferrals,
} from '../../db/queries';
import { applyUserPriceToProduct } from '../../lib/services/pricing';
import { resolvePromo, priceBreakdown } from '../../lib/services/promo';
import { charge } from '../../lib/services/wallet';
import { trySupplierAutoOrder } from '../../lib/services/supplierApi';
import { publicOrderId } from '../../lib/services/orderId';
import type { DBProduct } from '../../types';

const QTY_MIN = 1;
const QTY_MAX = 100;

function isPreorder(p: { unlimited_stock: boolean; stock: number }, qty: number): boolean {
  return !p.unlimited_stock && p.stock < qty;
}

function productHasDeliveryForm(p: DBProduct): boolean {
  return (p as { delivery_form_enabled?: boolean }).delivery_form_enabled === true;
}

export type BuyResult =
  | { ok: true; orderPublicId: string; items: string[]; pending: boolean; newBalance: number }
  | { ok: false; error: string };

/**
 * Wallet checkout — mirrors the bot's pay:wallet:do path exactly:
 * per-user price → promo → createOrder → charge → stock decrement →
 * supplier auto-order or item-pool claim → delivered_items.
 */
export async function buyProduct(productId: number, rawQty: number): Promise<BuyResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const qty = Math.max(QTY_MIN, Math.min(QTY_MAX, Math.floor(rawQty) || QTY_MIN));

  const raw = await getProduct(productId);
  if (!raw || !raw.active) return { ok: false, error: 'Product unavailable' };
  const p = await applyUserPriceToProduct(user.telegram_id, raw);

  const requiredRefs = Number(p.referral_required_count ?? 0);
  if (requiredRefs > 0) {
    const refs = await countReferrals(user.telegram_id);
    if (refs < requiredRefs) {
      return { ok: false, error: `This product needs ${requiredRefs} referrals (you have ${refs}).` };
    }
  }

  const promo = await resolvePromo(user.telegram_id, p.id, qty, p.price);
  const { discount, total } = priceBreakdown(p.price, qty, promo);
  if (user.balance < total) {
    return { ok: false, error: `Insufficient balance — need $${total.toFixed(2)}, you have $${user.balance.toFixed(2)}.` };
  }

  const preorder = isPreorder(p, qty);
  const manualForm = productHasDeliveryForm(p);

  const order = await createOrder({
    user_id: user.telegram_id,
    product_id: p.id,
    product_name: p.name,
    qty,
    unit_price: p.price,
    total,
    discount,
    promo_id: promo?.promo.id ?? null,
    delivery: `Order #${p.id}-${qty}`,
  });
  const newBalance = await charge(user.telegram_id, total, user.balance, `order:${order.id}`);

  if (!preorder) await decrementProductStock(p.id, qty);

  const supplierOrder = preorder || manualForm
    ? null
    : await trySupplierAutoOrder({ localProductId: p.id, qty, localOrderId: order.id });
  const items = preorder || manualForm
    ? []
    : supplierOrder?.items ?? (await claimProductItems(p.id, qty, order.id));

  const pendingText = manualForm
    ? 'Buyer details pending admin fulfillment.'
    : preorder
      ? 'Pre-order — your order is queued and will be delivered as soon as restock arrives.'
      : 'Delivery pending — our team will deliver shortly.';
  await setOrderDeliveredItems(order.id, items.length > 0 ? items.join('\n') : pendingText);

  revalidatePath('/orders');
  revalidatePath('/wallet');
  revalidatePath('/shop');
  return {
    ok: true,
    orderPublicId: publicOrderId(order),
    items,
    pending: items.length === 0,
    newBalance,
  };
}
