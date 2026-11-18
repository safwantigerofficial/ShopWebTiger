'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CE from '../../../components/CE';

export default function BuyPanel({
  productId, unitPrice, maxQty, preorder,
}: {
  productId: number; unitPrice: number; maxQty: number; preorder: boolean;
}) {
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const total = Math.round(unitPrice * qty * 100) / 100;

  return (
    <div className="space-y-4">
      {preorder && (
        <div className="rounded-xl p-3 text-sm flex items-start gap-2"
          style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.35)' }}>
          <CE id="6267039884016358504" />
          <span><b>Pre-order.</b> Out of stock — your order joins the queue and is fulfilled when stock arrives.</span>
        </div>
      )}
      <div>
        <label className="text-sm font-semibold" style={{ color: 'var(--fg2)' }}>Quantity</label>
        <input
          className="input mt-1.5"
          type="number" min={1} max={maxQty} value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
        />
      </div>
      <button className="btn-primary w-full !py-3"
        onClick={() => router.push(`/checkout/${productId}?qty=${qty}`)}>
        {preorder ? 'Pre-order' : 'Continue'}  →  ${total.toFixed(2)}
      </button>
    </div>
  );
}
