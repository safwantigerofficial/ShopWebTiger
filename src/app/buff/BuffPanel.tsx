'use client';
import { useState } from 'react';
import Link from 'next/link';
import { buffQuote, buffBuy } from '../actions/buff';
import CE from '../../components/CE';

type Quote = { ordersText: string; lines: { code: string; qty: number }[]; totalQty: number; priceUsdt: number };

export default function BuffPanel({ balance }: { balance: number }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [done, setDone] = useState<number | null>(null);

  async function doQuote() {
    setBusy(true); setErr('');
    const r = await buffQuote(text);
    setBusy(false);
    if (r.ok) setQuote({ ordersText: r.ordersText, lines: r.lines, totalQty: r.totalQty, priceUsdt: r.priceUsdt });
    else setErr(r.error);
  }

  async function buy() {
    if (!quote) return;
    setBusy(true); setErr('');
    const r = await buffBuy(quote.ordersText, quote.priceUsdt);
    setBusy(false);
    if (r.ok) { setDone(r.orderId); setQuote(null); setText(''); }
    else setErr(r.error);
  }

  if (done) {
    return (
      <div className="card space-y-3">
        <h2 className="font-bold text-green-400"><CE id="5854985398857503237" />  Buff order #B{done} placed</h2>
        <p className="text-sm text-slate-300">Tokens are on the way — usually ~1-2 minutes. Track it below under My buff orders.</p>
        <button className="btn-ghost w-full" onClick={() => setDone(null)}>Place another order</button>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      {!quote ? (
        <>
          <div className="text-sm text-slate-400">
            Enter invite codes — one per line, optionally with a quantity: <code className="text-brand">CODE 5</code> (default 1B, max 10 lines)
          </div>
          <textarea
            className="input font-mono text-sm min-h-[100px]"
            placeholder={'ABC123 5\nDEF456 1'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-primary w-full" disabled={busy || !text.trim()} onClick={doQuote}>
            {busy ? 'Checking…' : '<CE id="5265151230790884988" />  Get price'}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="bg-night-700 rounded-xl p-3 text-sm space-y-1">
            {quote.lines.map((l, i) => (
              <div key={i} className="flex justify-between font-mono">
                <span>{l.code}</span><span className="text-slate-400">{l.qty}B</span>
              </div>
            ))}
            <div className="border-t border-night-600 pt-2 mt-2 flex justify-between font-semibold">
              <span>Total {quote.totalQty}B</span>
              <span className="text-brand">${quote.priceUsdt.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">Wallet: ${balance.toFixed(2)}</div>
          {balance < quote.priceUsdt ? (
            <Link href="/wallet/topup" className="btn-primary w-full block text-center">Top up wallet first</Link>
          ) : (
            <button className="btn-primary w-full" disabled={busy} onClick={buy}>
              {busy ? 'Placing order…' : `<CE id="5854985398857503237" />  Confirm & Pay $${quote.priceUsdt.toFixed(2)}`}
            </button>
          )}
          <button className="btn-ghost w-full" onClick={() => setQuote(null)}>← Edit codes</button>
        </div>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
