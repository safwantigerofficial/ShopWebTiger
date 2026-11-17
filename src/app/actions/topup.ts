'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/session';
import {
  createDeposit,
  setCryptoPayInvoiceId,
  getDeposit,
  creditCryptoPayDeposit,
  listDeposits,
  setDepositStatus,
} from '../../db/queries';
import { createInvoice, getInvoices } from '../../lib/services/cryptopay';

export type InvoiceResult =
  | { ok: true; depositId: number; invoiceUrl: string }
  | { ok: false; error: string };

/** Create a CryptoBot USDT invoice — same flow as the bot's cryptobot_topup. */
export async function startCryptoTopup(amountUsd: number): Promise<InvoiceResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const amount = Math.round(amountUsd * 100) / 100;
  if (!Number.isFinite(amount) || amount < 0.5) {
    return { ok: false, error: 'Minimum top-up is $0.50' };
  }
  if (amount > 10000) return { ok: false, error: 'Amount too large' };

  const dep = await createDeposit({
    user_id: user.telegram_id,
    method: 'CryptoBot',
    amount,
    note: 'Crypto Pay USDT invoice awaiting payment (website)',
  });
  const invoiceResult = await createInvoice({ amount, payload: String(dep.id), expiresIn: 1800 });
  if (!invoiceResult.ok || !invoiceResult.invoice.bot_invoice_url) {
    await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
    return { ok: false, error: 'Could not create invoice — try again.' };
  }
  const invoiceId = String(invoiceResult.invoice.invoice_id);
  try {
    await setCryptoPayInvoiceId(dep.id, invoiceId);
  } catch {
    await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
    return { ok: false, error: 'Could not create invoice — try again.' };
  }
  return { ok: true, depositId: dep.id, invoiceUrl: invoiceResult.invoice.bot_invoice_url };
}

/** Poll an invoice; credit the wallet through the same RPC the bot uses. */
export async function checkCryptoTopup(depositId: number): Promise<
  { ok: true; credited: boolean; amount?: number } | { ok: false; error: string }
> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const dep = await getDeposit(depositId);
  if (!dep || dep.user_id !== user.telegram_id) return { ok: false, error: 'Deposit not found' };
  if (dep.status === 'approved') return { ok: true, credited: true, amount: dep.amount };
  if (dep.status !== 'pending' || !dep.tx_hash?.startsWith('cryptopay:')) {
    return { ok: false, error: 'This deposit is no longer pending.' };
  }
  const invoiceId = dep.tx_hash.slice('cryptopay:'.length);
  const result = await getInvoices([invoiceId]);
  if (!result.ok) return { ok: false, error: 'Could not reach payment provider — try again.' };
  const invoice = result.invoices.find((i) => String(i.invoice_id) === invoiceId);
  if (!invoice || invoice.status !== 'paid') {
    return { ok: true, credited: false };
  }
  if (invoice.payload !== undefined && invoice.payload !== String(dep.id)) {
    return { ok: false, error: 'Invoice mismatch.' };
  }
  if (Math.abs(Number(invoice.amount) - Number(dep.amount)) > 0.000001) {
    return { ok: false, error: 'Amount mismatch — contact support.' };
  }
  const credited = await creditCryptoPayDeposit(dep.id, `cryptopay:${invoiceId}`);
  revalidatePath('/wallet');
  return { ok: true, credited: credited.credited, amount: credited.amount ?? undefined };
}

export async function myDeposits() {
  const user = await requireUser();
  if (!user) return [];
  return listDeposits(user.telegram_id, 20);
}
