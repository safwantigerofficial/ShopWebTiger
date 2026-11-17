'use client';
import { useState } from 'react';
import { startCryptoTopup, checkCryptoTopup } from '../actions/topup';

export default function TopupPanel() {
  const [amount, setAmount] = useState('10');
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
    <div className="card space-y-3">
      <h2 className="font-semibold">💳 Top up — CryptoBot (USDT)</h2>
      {!invoice ? (
        <>
          <div className="flex gap-2">
            <input className="input" type="number" min="0.5" step="0.5" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="Amount in USD" />
            <button className="btn-primary shrink-0" disabled={busy} onClick={create}>
              {busy ? '…' : 'Create invoice'}
            </button>
          </div>
          <p className="text-xs text-slate-500">Pays via CryptoBot — USDT, instant credit after payment.</p>
        </>
      ) : (
        <div className="space-y-2">
          <a className="btn-primary w-full" href={invoice.url} target="_blank" rel="noreferrer">
            💎 Open invoice in CryptoBot
          </a>
          <button className="btn-ghost w-full" disabled={busy} onClick={check}>
            {busy ? 'Checking…' : '🔄 I paid — check'}
          </button>
        </div>
      )}
      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
