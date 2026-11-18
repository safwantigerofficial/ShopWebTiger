// Bot top-up screen copy (src/handlers/topup.ts + config/locales/en.ts).
import type { DBPaymentMethod } from '../../types';

const ce = (id: string, unicode: string): string => `{{ce:${id}|${unicode}}}`;

export const PE = {
  bkash_title: ce('4913863819836523928', '🇧🇩'),
  bkash_rate: ce('5884161133174067365', '💱'),
  bkash_example: ce('5278223861404421915', '💵'),
  bkash_enter: ce('5386367538735104399', '💳'),
  binance_title: ce('5875443023873053217', '🟡'),
  usdt_title: ce('5431647832748612816', '💵'),
  ton_title: ce('5265151230790884988', '💎'),
  bullet_send: ce('5794164805065514131', '✅'),
  bullet_paste: ce('5794085322400733645', '📝'),
  note: ce('6008233706039284019', '⚠️'),
  convert: ce('6023761060786346622', '🔄'),
} as const;

const T = {
  'topup.usdt.amount_prompt': 'How much USDT would you like to add?',
  'topup.usdt.amount_example': 'Enter the amount, for example `10` or `25.50`.',
  'topup.usdt.reserved_amount': 'Send exactly {amount} USDT',
  'topup.usdt.send_exact': 'Send exactly *{amount} USDT* to the address above.',
  'topup.usdt.other_amount': 'Any other amount will not be auto-credited and requires manual admin review.',
  'topup.usdt.validity': 'This amount is valid for 30 minutes from now.',
  'verify.usdt.no_quote': 'This USDT deposit has no locked amount. An admin will verify it manually.',
  'verify.usdt.quote_expired': 'This USDT payment quote expired. An admin will verify it manually.',
  'verify.usdt.amount_mismatch': 'The payment amount does not match the reserved amount of {expected} USDT. An admin will review it manually.',
} as const;

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const s = (T as Record<string, string>)[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? `{${k}}`));
}

export const formatUsdtAmount = (amount: number) => `${Number(amount).toFixed(2)} USDT`;

export function binancePayScreen(m: DBPaymentMethod): string {
  return [
    `${PE.binance_title} *Binance Pay Deposit*`,
    '',
    `*Pay ID:* \`${m.address ?? '(not set)'}\``,
    `*Binance Name:* \`${m.pay_name ?? '(not set)'}\``,
    '',
    `${PE.bullet_send} Send any USDT amount to the Pay ID above`,
    `${PE.bullet_paste} Paste your *Order ID* below`,
    '',
    `${PE.note} _Only up to 3 decimal places will be credited to your wallet._`,
    '',
    '⏰ _Only payments started after opening this screen and completed within 30 minutes will be credited._',
  ].join('\n');
}

export function bybitPayScreen(m: DBPaymentMethod): string {
  return [
    '*Bybit Pay Deposit*',
    '',
    `*Bybit UID / ID:* \`${m.address ?? '(not set)'}\``,
    `*Bybit Name:* \`${m.pay_name ?? '(not set)'}\``,
    '',
    `${PE.bullet_send} Send any USDT amount inside Bybit to the ID above`,
    `${PE.bullet_paste} Paste your *Bybit internal transfer TXID* below`,
    '',
    `${PE.note} _Only successful USDT internal transfers are auto-verified._`,
    '',
    '⏰ _Only payments started after opening this screen and completed within 30 minutes will be credited._',
  ].join('\n');
}

export function chainAmountScreen(m: DBPaymentMethod): string {
  const title =
    m.provider === 'usdt_bep20' ? 'USDT (BEP-20) Top-Up'
      : m.provider === 'usdt_trc20' ? 'USDT (TRC-20) Top-Up' : 'TON USDT Top-Up';
  return [
    `${PE.usdt_title} *${title}*`,
    '',
    `\`${m.address ?? '(address not set)'}\``,
    '',
    t('topup.usdt.amount_prompt'),
    t('topup.usdt.amount_example'),
  ].join('\n');
}

export function chainQuoteScreen(m: Pick<DBPaymentMethod, 'provider' | 'address'>, reservedAmount: number): string {
  const glyph = m.provider === 'usdt_ton' ? PE.ton_title : PE.usdt_title;
  const heading =
    m.provider === 'usdt_bep20' ? `${glyph} *USDT (BEP-20) Deposit*`
      : m.provider === 'usdt_trc20' ? `${glyph} *USDT (TRC-20) Deposit*` : `${glyph} *TON Network Deposit*`;
  const amt = reservedAmount.toFixed(4);
  const lines = [
    heading,
    '',
    `\`${m.address ?? '(address not set)'}\``,
    '',
    `${PE.note} *${t('topup.usdt.reserved_amount', { amount: amt })}*`,
    `${PE.bullet_send} ${t('topup.usdt.send_exact', { amount: amt })}`,
    `${PE.note} _${t('topup.usdt.other_amount')}_`,
    `⏰ _${t('topup.usdt.validity')}_`,
    `${PE.bullet_paste} Paste your *Transaction Hash (TXID)* below`,
    '',
  ];
  if (m.provider === 'usdt_bep20') {
    lines.push(`${PE.note} _AA Wallet users: paste the *Bundle Hash* from BscScan, not the AA TxHash._`);
    lines.push(`${PE.note} _Up to 4 decimal places only._`);
  } else if (m.provider === 'usdt_ton') {
    lines.push(`${PE.convert} _TON coins are automatically converted to USDT at live market rates._`);
  } else {
    lines.push(`${PE.convert} _TRX coins are automatically converted to USDT at live market rates._`);
  }
  return lines.join('\n');
}

export function ltcAmountScreen(m: DBPaymentMethod): string {
  return [
    '⚪ *Litecoin Top-Up*',
    '',
    `*Receiving address:* \`${m.address ?? '(not configured)'}\``,
    '',
    'Litecoin is a volatile coin, so we lock a USD↔LTC rate for *10 minutes* before you send.',
    '',
    '*How much (in USD) do you want to top up?*',
  ].join('\n');
}

export function ltcQuoteScreen(address: string, ltcAmount: number, rate: number, usd: number, ttlMin: number): string {
  return [
    '🟢 *Litecoin Top-Up Quote*',
    '',
    `*Send exactly:* \`${ltcAmount} LTC\``,
    `*To address:* \`${address}\``,
    '',
    `_Locked rate:_ $${rate.toFixed(2)} per LTC`,
    `_Quote expires:_ ${ttlMin} min from now`,
    `_Credit on success:_ *$${usd.toFixed(2)}*`,
    '',
    '1️⃣ Send the LTC amount above to the address',
    '2️⃣ Paste your *transaction hash* below',
  ].join('\n');
}

export function cryptobotAmountScreen(min: number): string {
  return `${PE.usdt_title} *CryptoBot USDT Top-Up*\n\nHow much USDT would you like to add?\nMinimum: *${formatUsdtAmount(min)}*`;
}

export function bkashAmountScreen(rate: number): string {
  return [
    `${PE.bkash_title} *bKash Top-Up*`,
    '',
    `${PE.bkash_rate} Dollar Rate: *1 USD = ${rate} BDT*`,
    `${PE.bkash_example} Example: *$10 = ৳${(10 * rate).toLocaleString('en-US')}*`,
    '',
    '━━━━━━━━━━━━━━━━',
    `${PE.bkash_enter} Enter the amount in USDT (e.g. 10).`,
    'You will receive a bKash payment link.',
    `Minimum: *${formatUsdtAmount(0.3)}*`,
  ].join('\n');
}

export function manualScreen(m: DBPaymentMethod): string {
  return `*${m.name}*\n\n${m.instructions ?? ''}`;
}
