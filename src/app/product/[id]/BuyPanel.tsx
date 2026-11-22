'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CE from '../../../components/CE';

export default function BuyPanel({
  productId, unitPrice, maxQty, preorder, mobileBar = false,
}: {
  productId: number; unitPrice: number; maxQty: number; preorder: boolean; mobileBar?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [raw, setRaw] = useState('1');
  const step = (d: number) => {
    const n = Math.max(1, Math.min(maxQty, qty + d));
    setQty(n); setRaw(String(n));
  };
  const router = useRouter();
  const total = Math.round(unitPrice * qty * 100) / 100;

  if (mobileBar) return (
    <>
      {/* Mobile — sticky buy bar above the bottom nav */}
      <div className="sm:hidden fixed left-0 right-0 bottom-[60px] z-40 px-3 pb-2 pt-3"
        style={{ background: 'linear-gradient(to top, var(--bg) 75%, transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button className="w-9 h-10 text-base font-bold" style={{ color: 'var(--fg2)' }}
              onClick={() => step(-1)}>−</button>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" aria-label="Quantity"
              className="w-12 h-10 text-center text-base font-bold bg-transparent outline-none"
              value={raw}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 6);
                if (!d) { setRaw(''); return; }
                const n = Math.max(1, Math.min(maxQty, Number(d)));
                setQty(n); setRaw(Number(d) > maxQty ? String(maxQty) : d);
              }}
              onBlur={() => setRaw(String(qty))}
            />
            <button className="w-9 h-10 text-base font-bold" style={{ color: 'var(--primary)' }}
              onClick={() => step(1)}>+</button>
          </div>
          <button className="btn-primary flex-1 h-10 !py-0 font-bold"
            onClick={() => router.push(`/checkout/${productId}?qty=${qty}`)}>
            {preorder ? 'Pre-order' : 'Buy'} · ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-3">
      {preorder && (
        <div className="rounded-xl p-3 text-sm flex items-start gap-2"
          style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.35)' }}>
          <CE id="6267039884016358504" />
          <span><b>Pre-order.</b> Out of stock — your order joins the queue and is fulfilled when stock arrives.</span>
        </div>
      )}
      <div>
        <label className="text-xs font-semibold" style={{ color: 'var(--fg2)' }}>Quantity</label>
        <div className="mt-1 flex items-center rounded-lg border" style={{ borderColor: 'var(--border2)', background: 'var(--surface)' }}>
          <button className="w-10 h-10 text-base font-bold shrink-0" style={{ color: 'var(--fg2)' }}
            onClick={() => step(-1)}>−</button>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" aria-label="Quantity"
            className="flex-1 h-10 text-center text-base font-bold bg-transparent outline-none"
            value={raw}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, '').slice(0, 6);
              if (!d) { setRaw(''); return; }
              const n = Math.max(1, Math.min(maxQty, Number(d)));
              setQty(n); setRaw(Number(d) > maxQty ? String(maxQty) : d);
            }}
            onBlur={() => setRaw(String(qty))}
          />
          <button className="w-10 h-10 text-base font-bold shrink-0" style={{ color: 'var(--primary)' }}
            onClick={() => step(1)}>+</button>
        </div>
      </div>
      <button className="btn-primary w-full"
        onClick={() => router.push(`/checkout/${productId}?qty=${qty}`)}>
        {preorder ? 'Pre-order' : 'Buy'} · ${total.toFixed(2)}
      </button>

    </div>
  );
}
