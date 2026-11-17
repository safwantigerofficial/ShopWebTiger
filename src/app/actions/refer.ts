'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/session';
import { convertReferralValue } from '../../db/queries';

const REFERRAL_USDT_PER_REF = 0.02;
const REFERRAL_MIN_CONVERT_USDT = 0.1;

export async function convertReferrals(): Promise<
  { ok: true; refsSpent: number; amount: number; newBalance: number } | { ok: false; error: string }
> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  try {
    const res = await convertReferralValue({
      user_id: user.telegram_id,
      legacyValue: REFERRAL_USDT_PER_REF,
      minUsd: REFERRAL_MIN_CONVERT_USDT,
    });
    revalidatePath('/refer');
    revalidatePath('/wallet');
    return { ok: true, refsSpent: res.refsSpent, amount: res.amount, newBalance: res.newBalance };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('INSUFFICIENT') || (e as { name?: string }).name === 'InsufficientReferralBalanceError') {
      return { ok: false, error: 'Not enough referral value to convert yet.' };
    }
    return { ok: false, error: 'Conversion failed — try again.' };
  }
}
