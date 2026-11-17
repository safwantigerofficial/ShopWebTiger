'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/session';
import { countReferralsAfter } from '../../db/queries';
import {
  getFreebie,
  claimFreebie,
  releaseFreebieClaim,
  countFreebieClaims,
} from '../../db/freebies';
import { placeBuffOrder, quoteBuff, buffErrorText, BuffError } from '../../lib/services/buff';
import { ensureLoaded } from '../../lib/services/settings';

const nullApi = { sendMessage: async () => ({}) };

type Result = { ok: true; delivered: string | null; buffOrderId?: number } | { ok: false; error: string };

async function gate(freebieId: number, telegramId: number) {
  const f = await getFreebie(freebieId);
  if (!f || !f.active) return { err: 'This freebie is no longer active.' as const, f: null };
  if (f.min_refs > 0) {
    const have = await countReferralsAfter(telegramId, f.created_at);
    if (have < f.min_refs) {
      return { err: `Needs ${f.min_refs} new referrals since it went live — you have ${have}.` as const, f: null };
    }
  }
  return { err: null, f };
}

/** Claim a normal (content/items) freebie — same RPC + gates as the bot. */
export async function claimFreebieAction(freebieId: number): Promise<Result> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const { err, f } = await gate(freebieId, user.telegram_id);
  if (err || !f) return { ok: false, error: err ?? 'Unavailable' };
  if (f.buff_qty) return { ok: false, error: 'Use the Buff claim flow for this freebie.' };
  try {
    const { delivered } = await claimFreebie(f.id, user.telegram_id);
    revalidatePath('/freebies');
    return { ok: true, delivered };
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    if (m.includes('FREEBIE_LIMIT')) return { ok: false, error: 'You already claimed your limit.' };
    if (m.includes('FREEBIE_OUT')) return { ok: false, error: 'Out of stock.' };
    return { ok: false, error: 'Claim failed — try again.' };
  }
}

/** Step 1 for buff freebies: validate the invite code and return a quote preview. */
export async function quoteBuffFreebieAction(
  freebieId: number,
  ordersText: string,
): Promise<{ ok: true; code: string; qty: number } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  await ensureLoaded();
  const { err, f } = await gate(freebieId, user.telegram_id);
  if (err || !f || !f.buff_qty) return { ok: false, error: err ?? 'Unavailable' };
  try {
    await quoteBuff(ordersText.trim(), f.buff_qty);
  } catch (e) {
    return { ok: false, error: buffErrorText(e) };
  }
  return { ok: true, code: ordersText.trim().split(/\s+/)[0] ?? '', qty: f.buff_qty };
}

/** Step 2: claim + fire the TunVN order; release the claim on failure (same as bot). */
export async function claimBuffFreebieAction(
  freebieId: number,
  ordersText: string,
): Promise<Result> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  await ensureLoaded();
  const { err, f } = await gate(freebieId, user.telegram_id);
  if (err || !f || !f.buff_qty) return { ok: false, error: err ?? 'Unavailable' };
  let claimId: number;
  try {
    ({ claimId } = await claimFreebie(f.id, user.telegram_id));
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    if (m.includes('FREEBIE_LIMIT')) return { ok: false, error: 'You already claimed your limit.' };
    if (m.includes('FREEBIE_OUT')) return { ok: false, error: 'Out of stock.' };
    return { ok: false, error: 'Claim failed — try again.' };
  }
  try {
    const res = await placeBuffOrder({
      api: nullApi as never,
      userId: user.telegram_id,
      ordersText: ordersText.trim(),
      channel: 'freebie',
      chargeUser: false,
      fixedQty: f.buff_qty,
      freebieClaimId: claimId,
    });
    revalidatePath('/freebies');
    revalidatePath('/buff');
    return { ok: true, delivered: null, buffOrderId: res.order.id };
  } catch (e) {
    if (!(e instanceof BuffError)) console.error(e);
    await releaseFreebieClaim(claimId).catch(() => undefined);
    return { ok: false, error: buffErrorText(e) };
  }
}

export async function freebieUsage(freebieId: number): Promise<number> {
  const user = await requireUser();
  if (!user) return 0;
  return countFreebieClaims(freebieId, user.telegram_id);
}
