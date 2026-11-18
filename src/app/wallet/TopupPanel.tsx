'use client';
import { useState } from 'react';
import { startCryptoTopup, checkCryptoTopup } from '../actions/topup';

export default function TopupPanel() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cryptobot');
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<{ depositId: number; url: string } | null>(null);
  const [msg, setMsg] = useState('');

  async function create() {
    setBusy(true); setMsg('');
    const r = await startCryptoTopup(Number(amount));
    setBusy(false);
    if (r.ok) setInvoice({ depositId: r.depositId, url: r.invoiceUrl });
    else setMsg(r.error);
  }

  async function check() {
    if (!invoice) return;
    setBusy(true); setMsg('');
    const r = await checkCryptoTopup(invoice.depositId);
    setBusy(false);
    if (!r.ok) setMsg(r.error);
    else if (r.credited) { setMsg(`✅ Credited $${(r.amount ?? 0).toFixed(2)} to your wallet!`); setInvoice(null); }
    else setMsg('Not paid yet — pay the invoice in Telegram, then check again.');
  }

  return (
    <div className="card !p-6">
      <h2 className="font-bold text-lg">Choose an amount</h2>
      {!invoice ? (
        <>
          <label className="text-sm font-semibold mt-4 block" style={{ color: 'var(--fg2)' }}>
            Amount (USD)
          </label>
          <div className="relative mt-1.5">
            <input className="input !py-3 pr-14" type="number" min="0.5" step="0.5" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
              style={{ color: 'var(--fg3)' }}>USD</span>
          </div>

          <div className="text-sm font-semibold mt-4" style={{ color: 'var(--fg2)' }}>Payment method</div>
          <label className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3.5 cursor-pointer"
            style={{ border: '1px solid var(--border2)' }}>
            <input type="radio" name="paymethod" value="cryptobot" checked={method === 'cryptobot'}
              onChange={() => setMethod('cryptobot')} className="w-4 h-4 accent-blue-600" />
            <span className="text-lg">💠</span>
            <span className="font-semibold text-[15px]">CryptoPay (CryptoBot)</span>
          </label>

          <p className="text-sm mt-3" style={{ color: 'var(--fg3)' }}>
            Payment details appear after you confirm your method.
          </p>
          <button className="btn-primary w-full !py-3.5 mt-3 text-[15px]" disabled={busy || !Number(amount)} onClick={create}>
            {busy ? 'Creating…' : 'Confirm payment method'}
          </button>
        </>
      ) : (
        <div className="space-y-3 mt-4">
          <a className="btn-primary w-full !py-3" href={invoice.url} target="_blank" rel="noreferrer">
            💎 Open invoice in CryptoBot
          </a>
          <button className="btn-ghost w-full !py-3" disabled={busy} onClick={check}>
            {busy ? 'Checking…' : '🔄 I paid — check'}
          </button>
        </div>
      )}
      {msg && <p className="text-sm mt-3" style={{ color: 'var(--tiger)' }}>{msg}</p>}
    </div>
  );
}
