'use client';
import { useState } from 'react';
import Link from 'next/link';
import { buyProduct } from '../../actions/shop';

export default function BuyPanel({
  productId, unitPrice, maxQty, balance,
}: { productId: number; unitPrice: number; maxQty: number; balance: number }) {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; orderPublicId: string; items: string[]; pending: boolean; newBalance: number }
    | { ok: false; error: string }
    | null
  >(null);
  const total = unitPrice * qty;

  async function buy() {
    setBusy(true);
    setResult(null);
    try {
      setResult(await buyProduct(productId, qty));
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Purchase failed' });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="card space-y-3">
        <h2 className="font-bold text-green-400">✅ Order {result.orderPublicId}</h2>
        {result.items.length > 0 ? (
          <div className="bg-night-700 rounded-xl p-3 text-sm font-mono whitespace-pre-wrap break-all">
            {result.items.join('\n')}
          </div>
        ) : (
          <p className="text-sm text-amber-300">{result.pending && 'Your order is queued — items will appear in My Orders once delivered.'}</p>
        )}
        <div className="flex gap-2">
          <Link href="/orders" className="btn-primary flex-1">My Orders</Link>
          <Link href="/shop" className="btn-ghost flex-1">Keep shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Quantity</span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-3" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <input
            className="input w-20 text-center"
            type="number" min={1} max={maxQty} value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
          />
          <button className="btn-ghost px-3" onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>+</button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Total</span>
        <span className="text-brand font-bold text-lg">${total.toFixed(2)}</span>
      </div>
      <div className="text-xs text-slate-500">Wallet balance: ${balance.toFixed(2)}</div>
      {result && !result.ok && <p className="text-red-400 text-sm">{result.error}</p>}
      {balance < total ? (
        <Link href="/wallet" className="btn-primary w-full">Top up wallet first</Link>
      ) : (
        <button className="btn-primary w-full" disabled={busy} onClick={buy}>
          {busy ? 'Processing…' : `💎 Buy now — $${total.toFixed(2)}`}
        </button>
      )}
    </div>
  );
}
