'use client';
import { useState, useTransition } from 'react';
import { startCryptoTopup, checkCryptoTopup, startReferenceTopup } from '../actions/topup';
import { ceText } from '../../lib/premiumEmoji';
import type { DBPaymentMethod } from '../../types';

type Invoice = { url: string; depositId: number };

/** Methods whose payment is instant/invoice based; the rest take a
 * payment reference (order id / tx hash) and go to pending review,
 * same as the bot. */
const AUTO: Record<string, 'cryptobot'> = { cryptobot: 'cryptobot' };

const PROVIDER_ICON: Record<string, string> = {
  manual: '🧾',
  binance_pay: '🟡',
  bybit_pay: '🟠',
  usdt_trc20: '🔗',
  usdt_bep20: '🔗',
  usdt_ton: '💎',
  ltc: 'Ł',
  cryptobot: '💠',
  zinipay: '💳',
};

const REF_LABEL: Record<string, string> = {
  binance_pay: 'Binance Pay order ID',
  bybit_pay: 'Bybit Pay order ID',
  usdt_trc20: 'Transaction hash',
  usdt_bep20: 'Transaction hash',
  usdt_ton: 'Transaction hash / memo',
  ltc: 'Transaction hash',
  manual: 'Payment reference',
  zinipay: 'Payment reference',
};

export default function TopupPanel({ methods }: { methods: DBPaymentMethod[] }) {
  const [method, setMethod] = useState<DBPaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const provider = method ? (AUTO[method.provider] ?? 'reference') : null;
  const min = method?.min_amount && method.min_amount > 0 ? method.min_amount : 1;

  function create() {
    if (!method) return;
    setMsg('');
    const a = parseFloat(amount);
    if (provider === 'cryptobot') {
      start(async () => {
        const r = await startCryptoTopup(a);
        if (!r.ok) return setMsg(r.error);
        setInvoice({ url: r.invoiceUrl, depositId: r.depositId });
      });
    } else {
      start(async () => {
        const r = await startReferenceTopup({
          methodName: method.name,
          amount: a,
          reference,
        });
        if (!r.ok) return setMsg(r.error);
        setDone(true);
      });
    }
  }

  function check() {
    if (!invoice) return;
    setMsg('Checking payment…');
    start(async () => {
      const r = await checkCryptoTopup(invoice.depositId);
      if (!r.ok) return setMsg(r.error);
      setMsg(r.credited ? `Credited $${r.amount?.toFixed(2)} ✓` : 'Not paid yet — complete the invoice, then check again.');
    });
  }

  function back() {
    setMethod(null);
    setInvoice(null);
    setDone(false);
    setMsg('');
    setAmount('');
    setReference('');
  }

  /* ---------- step 1: choose a method ---------- */
  if (!method) {
    return (
      <div className="card !p-5">
        <div className="text-sm mb-3" style={{ color: 'var(--fg2)' }}>
          Select a payment method
        </div>
        <div className="space-y-2">
          {methods.map((m) => (
            <button key={m.id} onClick={() => setMethod(m)}
              className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold text-[15px]"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
              <span className="flex items-center gap-3">
                <span className="text-lg">{m.emoji_unicode || PROVIDER_ICON[m.provider] || '💳'}</span>
                {m.name}
              </span>
              <span className="text-xs font-normal" style={{ color: 'var(--fg3)' }}>
                {m.min_amount ? `min $${m.min_amount}` : ''}
              </span>
            </button>
          ))}
          {methods.length === 0 && (
            <div className="text-sm" style={{ color: 'var(--fg3)' }}>No payment methods available right now.</div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- step 2: provider flow ---------- */
  return (
    <div className="card !p-5">
      <button onClick={back} className="text-sm mb-3 inline-flex items-center gap-1" style={{ color: 'var(--fg2)' }}>
        ← All methods
      </button>
      <div className="flex items-center gap-3">
        <span className="text-xl">{method.emoji_unicode || PROVIDER_ICON[method.provider] || '💳'}</span>
        <h3 className="font-bold">{ceText(method.name)}</h3>
      </div>

      {method.instructions && (
        <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--fg2)' }}>
          {ceText(method.instructions)}
        </p>
      )}

      {method.address && provider !== 'cryptobot' && (
        <div className="mt-3 rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
          <div className="min-w-0">
            <div className="text-xs" style={{ color: 'var(--fg3)' }}>
              {method.pay_name ? `Pay ${method.pay_name} — ID` : 'Pay to'}
            </div>
            <div className="font-mono text-sm break-all" style={{ color: 'var(--fg)' }}>
              {method.address}
            </div>
          </div>
        </div>
      )}

      {done ? (
        <div className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
          <div className="font-semibold">Top-up submitted ⏳</div>
          <p className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>
            Your payment is pending review. It will be credited shortly — you can watch it under Recent top-ups.
          </p>
        </div>
      ) : !invoice ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold block mb-1">Amount (USD)</label>
            <input className="input" inputMode="decimal" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder={`${min.toFixed(2)}`} />
          </div>
          {provider !== 'cryptobot' && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                {REF_LABEL[method.provider] ?? 'Payment reference'}
              </label>
              <input className="input" value={reference} onChange={(e) => setReference(e.target.value)}
                placeholder="Paste it here after paying" />
            </div>
          )}
          <button className="btn-primary w-full" disabled={pending || !amount || (provider !== 'cryptobot' && !reference)}
            onClick={create}>
            {pending ? '…' : provider === 'cryptobot' ? `Confirm — $${(parseFloat(amount) || 0).toFixed(2)}` : 'Submit payment'}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <a href={invoice.url} target="_blank" rel="noreferrer" className="btn-primary w-full block text-center">
            Open invoice in CryptoBot
          </a>
          <button className="btn-ghost w-full mt-2" onClick={check} disabled={pending}>
            I paid — check
          </button>
        </div>
      )}

      {msg && (
        <p className="mt-3 text-sm" style={{ color: msg.includes('✓') ? 'var(--ok)' : 'var(--warn)' }}>
          {msg}
        </p>
      )}
    </div>
  );
}
