'use server';

import { revalidatePath } from 'next/cache';
import { getSession, requireUser } from '../../lib/session';
import {
  createDeposit,
  setCryptoPayInvoiceId,
  getDeposit,
  creditCryptoPayDeposit,
  listDeposits,
  listPaymentMethods,
  setDepositStatus,
  expireStaleUserDeposits,
  setDepositNote,
  setZiniPayInvoiceId,
  findDepositByTxHash,
} from '../../db/queries';
import { createInvoice, getInvoices } from '../../lib/services/cryptopay';
import { verifyAndCreditDeposit } from '../../lib/services/depositVerify';
import { classifyReason, friendlyReason } from '../../lib/services/verifyReason';
import { reserveUniqueUsdtAmount, roundUsdtBase } from '../../lib/services/usdtQuote';
import { fetchLtcUsdRate, quoteLtc } from '../../lib/services/chainVerify';
import { createZiniPayInvoice, verifyZiniPayInvoice } from '../../lib/services/zinipay';
import { processZiniPayPaidInvoice } from '../../lib/services/zinipayDeposit';
import { consume, formatRetryAfter } from '../../lib/rateLimit';
import { siteOrigin } from '../../lib/origin';
import { env } from '../../env';
import { logger } from '../../lib/logger';
import * as S from '../../lib/services/topupScreens';
import type { DBPaymentMethod, DBUser } from '../../types';

const REVERIFY_WINDOW_MS = 15 * 60 * 1000;
const LTC_QUOTE_TTL_MIN = 10;

export type Fail = { ok: false; error: string };

/** Step 2 screen for a method (before any amount / reference). */
export type OpenResult =
  | Fail
  | {
      ok: true;
      provider: string;
      screen: string;
      /** What the user must enter next. */
      input: 'amount' | 'reference' | 'none';
      inputLabel?: string;
      min?: number;
      expiresAtMs?: number;
    };

export type QuoteResult =
  | Fail
  | { ok: true; screen: string; depositId: number; expiresAtMs: number; inputLabel: string; payAmount: string }
  | { ok: true; screen: string; depositId: number; invoiceUrl: string; kind: 'invoice' };

export type SubmitResult =
  | Fail
  | {
      ok: true;
      status: 'credited' | 'duplicate' | 'rejected' | 'pending';
      title: string;
      detail: string;
      amount?: number;
      newBalance?: number;
      depositId: number;
    };

async function methodById(id: number): Promise<DBPaymentMethod | null> {
  const methods = await listPaymentMethods();
  return methods.find((m) => m.id === id) ?? null;
}

function parseCryptoPayAmount(text: string, configuredMinimum: number): number | null {
  let cleaned = String(text)
    .trim()
    .replace(/\s+/g, '')
    .replace(/^(?:usdt|usd)/i, '')
    .replace(/(?:usdt|usd)$/i, '')
    .replace(/^[$€₮]/, '')
    .replace(/[$€₮]$/, '');
  if (!cleaned) return null;
  const comma = cleaned.lastIndexOf(',');
  const dot = cleaned.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.';
    const grouping = decimal === ',' ? '.' : ',';
    cleaned = cleaned.split(grouping).join('').replace(decimal, '.');
  } else {
    cleaned = cleaned.replace(',', '.');
  }
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  const minimum = Math.max(0.01, Number(configuredMinimum) || 0);
  if (!Number.isFinite(amount) || amount < minimum) return null;
  return Number(amount.toFixed(2));
}

const logUserOf = (u: DBUser) => ({
  telegram_id: u.telegram_id,
  username: u.username ?? null,
  first_name: u.first_name ?? null,
  email: (u as { email?: string | null }).email ?? null,
});

/* ------------------------------------------------------------------ */
/* Step 2 — open a method (bot: topup:method:<id>)                     */
/* ------------------------------------------------------------------ */
export async function openTopupMethod(methodId: number): Promise<OpenResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const m = await methodById(methodId);
  if (!m) return { ok: false, error: 'Unknown payment method' };
  const session = await getSession();
  session.topup = undefined;

  if (m.provider === 'usdt_trc20' || m.provider === 'usdt_bep20' || m.provider === 'usdt_ton') {
    if (!m.address) return { ok: false, error: '⚠️ This payment method has no wallet address configured. Please contact support.' };
    await session.save();
    return { ok: true, provider: m.provider, screen: S.chainAmountScreen(m), input: 'amount', min: Math.max(0.01, Number(m.min_amount) || 0) };
  }

  if (m.provider === 'binance_pay' || m.provider === 'bybit_pay') {
    const isBinance = m.provider === 'binance_pay';
    if (!m.address || (isBinance && !m.pay_name)) {
      return {
        ok: false,
        error: isBinance
          ? '⚠️ This Binance Pay method has no Pay ID / Pay Name configured. Please contact support.'
          : 'Warning: This Bybit Pay method has no Bybit UID / ID configured. Please contact support.',
      };
    }
    let depositId: number;
    try {
      const dep = await createDeposit({
        user_id: user.telegram_id,
        method: m.name,
        amount: 0.01,
        note: isBinance
          ? 'Binance Pay screen opened — awaiting order id'
          : 'Bybit Pay screen opened - awaiting internal transfer txid',
      });
      depositId = dep.id;
    } catch (err) {
      logger.error({ err }, `${m.provider}: pre-deposit insert failed`);
      return { ok: false, error: `⚠️ Could not start the ${isBinance ? 'Binance' : 'Bybit'} Pay top-up. Please try again or contact support.` };
    }
    const openedAtMs = Date.now();
    session.topup = { provider: m.provider, methodId: m.id, methodName: m.name, depositId, openedAtMs };
    await session.save();
    return {
      ok: true,
      provider: m.provider,
      screen: isBinance ? S.binancePayScreen(m) : S.bybitPayScreen(m),
      input: 'reference',
      inputLabel: isBinance ? 'Binance Pay Order ID' : 'Bybit internal transfer TXID',
      expiresAtMs: openedAtMs + 30 * 60 * 1000,
    };
  }

  if (m.provider === 'ltc') {
    if (!m.address) return { ok: false, error: '⚠️ This payment method has no Litecoin address configured. Please contact support.' };
    await session.save();
    return { ok: true, provider: m.provider, screen: S.ltcAmountScreen(m), input: 'amount', min: 0.01 };
  }

  if (m.provider === 'cryptobot') {
    const minimum = Math.max(0.01, Number(m.min_amount) || 0);
    await session.save();
    return { ok: true, provider: m.provider, screen: S.cryptobotAmountScreen(minimum), input: 'amount', min: minimum };
  }

  if (m.provider === 'zinipay') {
    await session.save();
    return { ok: true, provider: m.provider, screen: S.bkashAmountScreen(env.ZINIPAY_BDT_PER_USDT), input: 'amount', min: 0.3 };
  }

  await session.save();
  return { ok: true, provider: 'manual', screen: S.manualScreen(m), input: 'none' };
}

/* ------------------------------------------------------------------ */
/* Step 3 — amount → quote / invoice                                   */
/* ------------------------------------------------------------------ */
export async function submitTopupAmount(methodId: number, text: string): Promise<QuoteResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const m = await methodById(methodId);
  if (!m) return { ok: false, error: 'Unknown payment method' };
  const session = await getSession();

  // ---- USDT chains (bot: handleChainUsdAmount) ----
  if (m.provider === 'usdt_trc20' || m.provider === 'usdt_bep20' || m.provider === 'usdt_ton') {
    const baseAmount = parseCryptoPayAmount(text, m.min_amount);
    if (baseAmount === null) {
      return { ok: false, error: `❌ Please send a valid USDT amount (minimum: ${Math.max(0.01, Number(m.min_amount) || 0).toFixed(2)} USDT).` };
    }
    let quote: Awaited<ReturnType<typeof reserveUniqueUsdtAmount>>;
    try {
      quote = await reserveUniqueUsdtAmount({ baseAmount, provider: m.provider });
    } catch (err) {
      logger.error({ err }, 'USDT unique amount reservation failed');
      return { ok: false, error: '⚠️ Could not reserve a payment amount. Please try again shortly.' };
    }
    if (!quote) return { ok: false, error: '⚠️ All payment amounts are busy right now. Please try again in a few minutes.' };
    let depositId: number;
    try {
      const dep = await createDeposit({
        user_id: user.telegram_id,
        method: m.name,
        amount: roundUsdtBase(baseAmount),
        expected_amount: quote.amount,
        quote_expires_at: quote.expiresAt.toISOString(),
        note: `USDT unique amount quote: ${quote.amount.toFixed(4)} USDT`,
      });
      depositId = dep.id;
    } catch (err) {
      logger.error({ err }, 'USDT deposit insert failed');
      return { ok: false, error: '⚠️ Could not reserve a payment amount. Please try again shortly.' };
    }
    const openedAtMs = Date.now();
    session.topup = { provider: m.provider, methodId: m.id, methodName: m.name, depositId, openedAtMs, expiresAtMs: quote.expiresAt.getTime() };
    await session.save();
    return {
      ok: true,
      screen: S.chainQuoteScreen(m, quote.amount),
      depositId,
      expiresAtMs: quote.expiresAt.getTime(),
      inputLabel: 'Transaction Hash (TXID)',
      payAmount: `${quote.amount.toFixed(4)} USDT`,
    };
  }

  // ---- LTC (bot: handleLtcUsdAmount) ----
  if (m.provider === 'ltc') {
    const usd = Number(String(text).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(usd) || usd <= 0) return { ok: false, error: '❌ Please send a positive USD amount (e.g. 10 or 25.50).' };
    let rate: number;
    try {
      rate = await fetchLtcUsdRate();
    } catch (err) {
      logger.warn({ err }, 'LTC rate fetch failed');
      return { ok: false, error: '⚠️ Could not fetch the LTC/USD rate right now. Please try again in a minute, or use a different payment method.' };
    }
    const { ltcAmount, expiresAt } = quoteLtc(usd, rate);
    let depositId: number;
    try {
      const dep = await createDeposit({
        user_id: user.telegram_id,
        method: m.name,
        amount: usd,
        expected_amount: ltcAmount,
        quote_expires_at: expiresAt.toISOString(),
        note: `LTC quote: $${usd} = ${ltcAmount} LTC @ $${rate}/LTC`,
      });
      depositId = dep.id;
    } catch (err) {
      logger.error({ err }, 'LTC deposit insert failed');
      return { ok: false, error: '⚠️ Could not lock the LTC quote. Please try again or contact support.' };
    }
    session.topup = { provider: m.provider, methodId: m.id, methodName: m.name, depositId, openedAtMs: Date.now(), expiresAtMs: expiresAt.getTime() };
    await session.save();
    return {
      ok: true,
      screen: S.ltcQuoteScreen(m.address ?? '', ltcAmount, rate, usd, LTC_QUOTE_TTL_MIN),
      depositId,
      expiresAtMs: expiresAt.getTime(),
      inputLabel: 'Transaction hash',
      payAmount: `${ltcAmount} LTC`,
    };
  }

  // ---- CryptoBot (bot: handleCryptoBotUsdAmount) ----
  if (m.provider === 'cryptobot') {
    const minimum = Math.max(0.01, Number(m.min_amount) || 0);
    const amount = parseCryptoPayAmount(text, minimum);
    if (amount === null) return { ok: false, error: `❌ Please send a valid USDT amount (minimum: ${S.formatUsdtAmount(minimum)}).` };
    const rounded = Number(amount.toFixed(2));
    let dep;
    try {
      dep = await createDeposit({ user_id: user.telegram_id, method: m.name, amount: rounded, note: 'Crypto Pay USDT invoice awaiting payment' });
    } catch (err) {
      logger.error({ err }, 'Crypto Pay deposit insert failed');
      return { ok: false, error: '⚠️ Could not start the CryptoBot top-up. Please try again or use another payment method.' };
    }
    const inv = await createInvoice({ amount: rounded, payload: String(dep.id), expiresIn: 1800 });
    if (!inv.ok || !inv.invoice.bot_invoice_url) {
      await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
      return { ok: false, error: '⚠️ Could not create a CryptoBot invoice right now. Please try again shortly.' };
    }
    try {
      await setCryptoPayInvoiceId(dep.id, String(inv.invoice.invoice_id));
    } catch {
      await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
      return { ok: false, error: '⚠️ Could not create a CryptoBot invoice right now. Please try again shortly.' };
    }
    return {
      ok: true,
      kind: 'invoice',
      depositId: dep.id,
      invoiceUrl: inv.invoice.bot_invoice_url,
      screen: `${S.PE.usdt_title} *CryptoBot invoice ready*\n\nAmount: *${S.formatUsdtAmount(rounded)}*\n\nTap *Open invoice*, complete the payment in CryptoBot, then tap *Check*.`,
    };
  }

  // ---- bKash / ZiniPay (bot: handleZiniPayUsdAmount) ----
  if (m.provider === 'zinipay') {
    const minimum = 0.3;
    const amount = parseCryptoPayAmount(text, minimum);
    if (amount === null) return { ok: false, error: `⚠️ Enter a valid amount. Minimum: ${S.formatUsdtAmount(minimum)}` };
    const invoiceAmountBdt = Math.round(amount * env.ZINIPAY_BDT_PER_USDT);
    let dep;
    try {
      dep = await createDeposit({
        user_id: user.telegram_id,
        method: m.name,
        amount,
        expected_amount: invoiceAmountBdt,
        note: 'ZiniPay bKash invoice awaiting payment',
      });
    } catch (err) {
      logger.error({ err }, 'ZiniPay deposit insert failed');
      return { ok: false, error: '⚠️ Could not start the bKash top-up. Please try again.' };
    }
    const origin = siteOrigin();
    const webhookUrl = env.ZINIPAY_WEBHOOK_URL || (origin ? `${origin}/api/zinipay/webhook` : '');
    if (!webhookUrl) {
      await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
      return { ok: false, error: '⚠️ ZiniPay needs a public webhook URL. Please contact the administrator.' };
    }
    const backUrl = origin ? `${origin}/wallet?zinipay=${dep.id}` : undefined;
    const inv = await createZiniPayInvoice({
      amount: invoiceAmountBdt,
      customerName: [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined,
      customerEmail: (user as { email?: string | null }).email || `tg${user.telegram_id}@safwantiger.com`,
      validationId: `TG-${dep.id}`,
      metadata: {
        deposit_id: String(dep.id),
        telegram_id: String(user.telegram_id),
        wallet_amount_usdt: String(amount),
        invoice_amount_bdt: String(invoiceAmountBdt),
      },
      webhookUrl,
      redirectUrl: env.ZINIPAY_REDIRECT_URL || backUrl,
      cancelUrl: env.ZINIPAY_CANCEL_URL || backUrl,
    });
    if (!inv.ok) {
      await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
      logger.warn({ reason: inv.reason, depositId: dep.id }, 'ZiniPay invoice creation failed');
      return { ok: false, error: '⚠️ Could not create the bKash payment invoice. Please try again later.' };
    }
    try {
      await setZiniPayInvoiceId(dep.id, inv.invoice.invoice_id);
    } catch (err) {
      await setDepositStatus(dep.id, 'rejected').catch(() => undefined);
      logger.error({ err, depositId: dep.id }, 'ZiniPay invoice persistence failed');
      return { ok: false, error: '⚠️ Could not save the bKash invoice. Please try again later.' };
    }
    return {
      ok: true,
      kind: 'invoice',
      depositId: dep.id,
      invoiceUrl: inv.invoice.payment_url,
      screen: `${S.PE.bkash_title} *bKash invoice ready*\n\nWallet credit: *${S.formatUsdtAmount(amount)}*\nPay bKash: *${invoiceAmountBdt} BDT*\n\nOpen the payment page, complete bKash payment, and your wallet will be credited automatically.`,
    };
  }

  return { ok: false, error: 'This method does not take an amount.' };
}

/* ------------------------------------------------------------------ */
/* Step 4 — paste TXID / Order ID → auto-verify (bot handlers)         */
/* ------------------------------------------------------------------ */
export async function submitTopupReference(text: string): Promise<SubmitResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const session = await getSession();
  const flow = session.topup;
  if (!flow) return { ok: false, error: 'This payment screen expired. Please choose the payment method again.' };
  const provider = flow.provider;
  const cleaned = String(text).replace(/\s+/g, '');

  let ref: string;
  let submission: { txHash?: string; orderId?: string };
  let label = 'Tx';
  let rlKey: string;
  let rlLimit = 5;

  if (provider === 'binance_pay') {
    if (!/^\d{6,}$/.test(cleaned)) {
      return { ok: false, error: "❌ That doesn't look like a Binance Pay Order ID. It should be the 18-digit numeric ID shown on the Binance Pay receipt (e.g. 430098765432109876)." };
    }
    ref = cleaned; submission = { orderId: ref }; label = 'Order ID'; rlKey = `binance_pay:${user.telegram_id}`;
  } else if (provider === 'bybit_pay') {
    if (!/^[A-Za-z0-9_-]{6,100}$/.test(cleaned)) {
      return { ok: false, error: "That doesn't look like a Bybit internal transfer TXID. Paste the full TXID from your Bybit transfer receipt." };
    }
    ref = cleaned; submission = { orderId: ref }; label = 'Bybit TXID'; rlKey = `bybit_pay:${user.telegram_id}`;
  } else if (provider === 'usdt_trc20' || provider === 'usdt_bep20' || provider === 'usdt_ton') {
    rlKey = `chain_tx:${user.telegram_id}`; rlLimit = 10;
    if (provider === 'usdt_trc20') {
      const s = cleaned.replace(/^0x/i, '');
      if (!/^[0-9a-fA-F]{64}$/.test(s)) return { ok: false, error: "❌ That doesn't look like a TRON tx hash. Paste the 64-character hex transaction id from your wallet." };
      ref = s.toLowerCase();
    } else if (provider === 'usdt_bep20') {
      const s = cleaned.replace(/^0x/i, '');
      if (!/^[0-9a-fA-F]{64}$/.test(s)) return { ok: false, error: "❌ That doesn't look like a BSC tx hash. Paste the 0x… 66-character transaction id from your wallet." };
      ref = '0x' + s.toLowerCase();
    } else {
      if (!/^[0-9a-fA-F]{64}$/.test(cleaned) && !/^[A-Za-z0-9+/=_-]{43,44}$/.test(cleaned)) {
        return { ok: false, error: "❌ That doesn't look like a TON tx hash. Paste the 64-character hex hash from Tonviewer / Tonscan, or the base64 hash from your wallet." };
      }
      ref = cleaned;
    }
    submission = { txHash: ref };
  } else if (provider === 'ltc') {
    rlKey = `ltc_tx:${user.telegram_id}`; rlLimit = 10;
    const s = String(text).trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(s)) return { ok: false, error: "❌ That doesn't look like a Litecoin tx hash. Paste the 64-character hex transaction id from your wallet." };
    if (flow.expiresAtMs && Date.now() > flow.expiresAtMs) {
      session.topup = undefined; await session.save();
      return { ok: false, error: '⏰ Your LTC quote expired. Choose Litecoin again to get a fresh rate.' };
    }
    ref = s; submission = { txHash: ref };
  } else {
    return { ok: false, error: 'This method does not take a reference.' };
  }

  const rl = consume(rlKey, rlLimit, 60_000);
  if (!rl.ok) return { ok: false, error: `⏱ Too many attempts. Please try again in ${formatRetryAfter(rl.retryAfterMs)}.` };

  let depId = flow.depositId;
  let isReverify = false;
  if (submission.txHash) {
    const existing = await findDepositByTxHash(ref).catch(() => null);
    if (existing) {
      const ageMs = Date.now() - new Date(existing.created_at).getTime();
      const ok = existing.user_id === user.telegram_id && existing.status === 'pending' && Number.isFinite(ageMs) && ageMs >= 0 && ageMs < REVERIFY_WINDOW_MS;
      if (!ok) {
        session.topup = undefined; await session.save();
        return { ok: true, status: 'duplicate', depositId: existing.id, title: '❌ Already-used transaction.', detail: 'This transaction hash has already been used to credit a previous deposit. Each transaction can only be used once.' };
      }
      depId = existing.id; isReverify = true;
    }
  }
  session.topup = undefined;
  await session.save();

  const dep = await getDeposit(depId);
  if (!dep || dep.user_id !== user.telegram_id) return { ok: false, error: '⚠️ Deposit not found. Please reopen the payment screen.' };
  if (dep.status !== 'pending') {
    return { ok: false, error: `⚠️ This deposit has already been ${dep.status}. Open a fresh payment screen to submit a new reference.` };
  }
  if (provider === 'binance_pay') await setDepositNote(depId, `Binance Pay order id submitted: ${ref}`).catch(() => undefined);
  if (provider === 'bybit_pay') await setDepositNote(depId, `Bybit internal transfer TXID submitted: ${ref}`).catch(() => undefined);

  let result: Awaited<ReturnType<typeof verifyAndCreditDeposit>>;
  try {
    result = await verifyAndCreditDeposit({
      deposit: dep,
      submission,
      openedAtMs: flow.openedAtMs,
      isReverify,
      logUser: logUserOf(user),
    });
  } catch (err) {
    logger.error({ err, depId }, `${provider} auto-verify threw`);
    result = { ok: false, reason: `verifier crashed: ${(err as Error)?.message ?? String(err)}` };
  }
  revalidatePath('/wallet');

  if (result.ok) {
    const title =
      provider === 'binance_pay' ? `✅ Transaction Confirmed! (#${depId})`
        : provider === 'bybit_pay' ? `✅ Bybit Payment Confirmed! (#${depId})`
          : `✅ Auto-verified (#${depId}).`;
    const amt = provider === 'binance_pay' || provider === 'bybit_pay' ? result.amount.toFixed(3) : result.amount.toFixed(2);
    return {
      ok: true, status: 'credited', depositId: depId, title,
      detail: `${label}: ${ref}\nCredited: $${amt}\nNew balance: $${Number(result.newBalance).toFixed(2)}`,
      amount: result.amount, newBalance: Number(result.newBalance),
    };
  }

  const klass = classifyReason(result.reason);
  await setDepositNote(depId, `auto-verify failed: ${result.reason}${submission.orderId ? ` (${label.toLowerCase()} ${ref})` : ''}`).catch(() => undefined);
  const friendly = friendlyReason(result.reason, S.t);
  if (klass === 'duplicate') {
    return { ok: true, status: 'duplicate', depositId: depId, title: `❌ Already-used ${label === 'Tx' ? 'transaction' : label} (#${depId}).`, detail: `${label}: ${ref}\nThis has already been used to credit a previous deposit. Each one can only be used once.` };
  }
  if (klass === 'reject') {
    await setDepositStatus(depId, 'rejected').catch(() => undefined);
    return { ok: true, status: 'rejected', depositId: depId, title: `❌ Disapproved (#${depId}).`, detail: `${label}: ${ref}\n${friendly}\n\nThis payment did not match our records. If you believe this is a mistake, contact support.` };
  }
  return { ok: true, status: 'pending', depositId: depId, title: `⏳ Submitted (#${depId}) — pending admin review.`, detail: `${label}: ${ref}\n${friendly}\n\nAdmin will check your payment manually and credit your wallet shortly.` };
}

/* ------------------------------------------------------------------ */
/* Manual provider (bot: topup:request:<id>)                           */
/* ------------------------------------------------------------------ */
export async function requestManualTopup(methodId: number): Promise<Fail | { ok: true; depositId: number; message: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const m = await methodById(methodId);
  if (!m || m.provider !== 'manual') return { ok: false, error: 'Unknown payment method' };
  const dep = await createDeposit({ user_id: user.telegram_id, method: m.name, amount: 0 });
  revalidatePath('/wallet');
  return { ok: true, depositId: dep.id, message: `✅ Topup request submitted (#${dep.id}).\nAdmin will verify and credit your wallet shortly.` };
}

/* ------------------------------------------------------------------ */
/* Invoice checks (bot: cryptopay:check / zinipay:check)               */
/* ------------------------------------------------------------------ */
export type CheckResult = { ok: true; credited: boolean; amount?: number; message: string } | Fail;

export async function checkInvoiceTopup(depositId: number): Promise<CheckResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const dep = await getDeposit(depositId);
  if (!dep || dep.user_id !== user.telegram_id) return { ok: false, error: 'Deposit not found' };
  if (dep.status === 'approved') return { ok: true, credited: true, amount: Number(dep.amount), message: 'Payment already processed.' };

  if (dep.status === 'pending' && dep.tx_hash?.startsWith('cryptopay:')) {
    const invoiceId = dep.tx_hash.slice('cryptopay:'.length);
    const result = await getInvoices([invoiceId]);
    if (!result.ok) return { ok: false, error: 'Could not check payment right now. Try again shortly.' };
    const invoice = result.invoices.find((i) => String(i.invoice_id) === invoiceId);
    if (!invoice || invoice.status !== 'paid') return { ok: true, credited: false, message: 'Payment not received yet. Tap Check again after paying.' };
    if (invoice.payload !== undefined && invoice.payload !== String(dep.id)) return { ok: false, error: 'Invoice mismatch.' };
    if (Math.abs(Number(invoice.amount) - Number(dep.amount)) > 0.000001) return { ok: false, error: 'Amount mismatch — contact support.' };
    const credited = await creditCryptoPayDeposit(dep.id, `cryptopay:${invoiceId}`);
    revalidatePath('/wallet');
    return credited.credited
      ? { ok: true, credited: true, amount: credited.amount ?? undefined, message: 'Payment confirmed and wallet credited.' }
      : { ok: true, credited: false, message: 'Payment already processed.' };
  }

  if (dep.status === 'pending' && dep.tx_hash?.startsWith('zinipay:')) {
    const invoiceId = dep.tx_hash.slice('zinipay:'.length);
    const result = await verifyZiniPayInvoice(invoiceId);
    if (!result.ok) return { ok: false, error: 'Could not verify the payment right now.' };
    try {
      const r = await processZiniPayPaidInvoice(dep.id, result.invoice);
      revalidatePath('/wallet');
      return r.credited
        ? { ok: true, credited: true, amount: r.amount ?? undefined, message: 'Payment verified and wallet credited.' }
        : { ok: true, credited: false, message: 'Payment is still pending.' };
    } catch (err) {
      logger.warn({ err, depositId }, 'ZiniPay check processing failed');
      return { ok: false, error: 'Payment verification failed.' };
    }
  }
  return { ok: false, error: 'This payment is no longer pending.' };
}

export async function myDeposits() {
  const user = await requireUser();
  if (!user) return [];
  await expireStaleUserDeposits(user.telegram_id).catch(() => undefined);
  return listDeposits(user.telegram_id, 20);
}
