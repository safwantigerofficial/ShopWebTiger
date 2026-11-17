'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/session';
import {
  quoteBuff,
  placeBuffOrder,
  listBuffOrders,
  buffErrorText,
  BuffError,
} from '../../lib/services/buff';
import {
  ensureLoaded,
  getBuffEnabled,
  getBuffName,
  getBuffDescription,
  getBuffWarranty,
  getBuffUnitPrice,
} from '../../lib/services/settings';

const nullApi = { sendMessage: async () => ({}) };

export async function buffInfo() {
  const user = await requireUser();
  if (!user) return null;
  await ensureLoaded();
  return {
    enabled: getBuffEnabled(),
    name: getBuffName(),
    description: getBuffDescription(),
    warranty: getBuffWarranty(),
    unitPrice: getBuffUnitPrice(),
    balance: user.balance,
  };
}

export type BuffQuoteResult =
  | { ok: true; ordersText: string; lines: { code: string; qty: number }[]; totalQty: number; priceUsdt: number }
  | { ok: false; error: string };

export async function buffQuote(ordersText: string): Promise<BuffQuoteResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  await ensureLoaded();
  if (!getBuffEnabled()) return { ok: false, error: 'Buff Token is turned off right now.' };
  try {
    const q = await quoteBuff(ordersText.trim());
    if (!q.fundable) return { ok: false, error: 'Buff service is busy — try again later.' };
    return {
      ok: true,
      ordersText: q.ordersText,
      lines: q.lines,
      totalQty: q.totalQty,
      priceUsdt: q.priceUsdt,
    };
  } catch (e) {
    return { ok: false, error: buffErrorText(e) };
  }
}

export async function buffBuy(
  ordersText: string,
  maxPriceUsdt: number,
): Promise<{ ok: true; orderId: number; priceUsdt: number } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  await ensureLoaded();
  try {
    const res = await placeBuffOrder({
      api: nullApi as never,
      userId: user.telegram_id,
      ordersText: ordersText.trim(),
      channel: 'bot',
      chargeUser: true,
      maxPriceUsdt,
    });
    revalidatePath('/buff');
    revalidatePath('/wallet');
    return { ok: true, orderId: res.order.id, priceUsdt: res.order.price_usdt };
  } catch (e) {
    return { ok: false, error: buffErrorText(e) };
  }
}

export async function myBuffOrders() {
  const user = await requireUser();
  if (!user) return [];
  return listBuffOrders({ userId: user.telegram_id, limit: 20 });
}
