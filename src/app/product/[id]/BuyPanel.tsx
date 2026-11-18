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
      <div className="space-y-3">
        <h2 className="font-bold" style={{ color: 'var(--brand)' }}>✅ Order {result.orderPublicId}</h2>
        {result.items.length > 0 ? (
          <div className="rounded-xl p-3 text-sm font-mono whitespace-pre-wrap break-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            {result.items.join('\n')}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--tiger)' }}>
            {result.pending && 'Your order is queued — items will appear in My Orders once delivered.'}
          </p>
        )}
        <div className="flex gap-2">
          <Link href="/orders" className="btn-primary flex-1">My orders</Link>
          <Link href="/shop" className="btn-ghost flex-1">Keep shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold" style={{ color: 'var(--fg2)' }}>Quantity</label>
        <input
          className="input mt-1.5"
          type="number" min={1} max={maxQty} value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
        />
      </div>
      {result && !result.ok && <p className="text-red-500 text-sm">{result.error}</p>}
      {balance < total ? (
        <Link href="/wallet" className="btn-primary w-full !py-3">Top up wallet first</Link>
      ) : (
        <button className="btn-primary w-full !py-3" disabled={busy} onClick={buy}>
          {busy ? 'Processing…' : `Continue  →  $${total.toFixed(2)}`}
        </button>
      )}
    </div>
  );
}
