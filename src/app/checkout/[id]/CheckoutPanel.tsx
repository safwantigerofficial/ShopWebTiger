'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { buyProduct } from '../../actions/shop';
import PayFlow from '../../../components/PayFlow';
import { MethodIcon } from '../../wallet/TopupPanel';
import CEText from '../../../components/CEText';
import CE from '../../../components/CE';
import { downloadTxt } from '../../../lib/downloadTxt';
import { ceText } from '../../../lib/premiumEmoji';
import type { DBPaymentMethod } from '../../../types';
import UsingMethod, { type Tutorial } from '../../../components/UsingMethod';

const WALLET_EMOJI_ID = '6028517788606272241';

export default function CheckoutPanel({
  productId, unitPrice, maxQty, balance, productName, methods, preorder, qty: initQty, tutorial,
}: {
  productId: number; unitPrice: number; maxQty: number; balance: number;
  productName: string; methods: DBPaymentMethod[]; preorder: boolean; qty: number; tutorial: Tutorial;
}) {
  const [step, setStep] = useState<'review' | 'method' | 'pay' | 'done'>('review');
  const [qty] = useState(initQty);
  const [method, setMethod] = useState<'wallet' | DBPaymentMethod | null>(null);
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const copyItems = () => {
    if (!result?.ok || !result.items.length) return;
    navigator.clipboard.writeText(result.items.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  const [result, setResult] = useState<
    | { ok: true; orderPublicId: string; items: string[]; pending: boolean; newBalance: number }
    | { ok: false; error: string }
    | null
  >(null);
  const total = Math.round(unitPrice * qty * 100) / 100;

  function buyWallet() {
    start(async () => {
      try {
        const r = await buyProduct(productId, qty);
        setResult(r);
        if (r.ok) setStep('done');
        else { setMsg(r.error); setStep('method'); }
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Purchase failed');
        setStep('method');
      }
    });
  }

  function onCredited(newBalance: number | null) {
    if (newBalance !== null && newBalance + 0.0001 < total) {
      setMsg(`Payment credited to your wallet (balance $${newBalance.toFixed(2)}), but it is less than the order total $${total.toFixed(2)}. Top up the difference, then pay with Wallet.`);
      return;
    }
    setMsg('Payment received — delivering your order…');
    buyWallet();
  }

  /* ---------- done ---------- */
  if (step === 'done' && result?.ok) {
    return (
      <div className="space-y-3">
        <h2 className="font-bold" style={{ color: 'var(--brand)' }}>
          <CE id="5854985398857503237" size={18} /> Order {result.orderPublicId}
        </h2>
        {result.items.length > 0 ? (
          <>
            <div className="rounded-xl p-3 text-sm font-mono whitespace-pre-wrap break-all relative"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <button
                onClick={copyItems}
                className="absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded-md"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: copied ? 'var(--brand)' : 'var(--fg2)' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              {result.items.join('\n')}
            </div>
            <button className="btn-ghost w-full"
              onClick={() => downloadTxt(`${result.orderPublicId}.txt`, `${productName} — order ${result.orderPublicId}\n\n${result.items.join('\n')}`)}>
              <CE id="5318845185348626090" /> Download .txt
            </button>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--fg2)' }}>
            Your order is queued — items will appear in My Orders once delivered.
          </p>
        )}
        <UsingMethod t={tutorial} />
        <div className="flex gap-2">
          <Link href="/orders" className="btn-primary flex-1">My orders</Link>
          <Link href="/shop" className="btn-ghost flex-1">Keep shopping</Link>
        </div>
      </div>
    );
  }

  /* ---------- step 1: review ---------- */
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="text-sm" style={{ color: 'var(--fg3)' }}>Your order</div>
        <h2 className="text-2xl font-extrabold">Review</h2>
        <div className="font-bold">{ceText(productName)}</div>
        {preorder && (
          <div className="rounded-xl p-3 text-sm flex items-start gap-2"
            style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.35)' }}>
            <CE id="6267039884016358504" />
            <span><b>Pre-order.</b> This item is out of stock — your order is placed in the queue and items arrive when stock is refilled.</span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--fg2)' }}>
          <span>Quantity</span><b style={{ color: 'var(--fg)' }}>{qty}</b>
        </div>
        <div className="flex justify-between items-baseline pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--fg2)' }}>Total</span>
          <span className="text-3xl font-extrabold">${total.toFixed(2)}</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--fg3)' }}>
          Check the amount and details before confirming.
        </p>
        <button className="btn-primary w-full !py-3" onClick={() => setStep('method')}>
          Continue
        </button>
        <Link href={`/product/${productId}`} className="btn-ghost w-full text-center block">Back</Link>
      </div>
    );
  }

  /* ---------- step 2: choose how to pay ---------- */
  if (step === 'method') {
    const walletOk = balance >= total;
    return (
      <div className="space-y-3">
        <h3 className="font-bold">Choose how to pay</h3>
        <button
          className="w-full text-left rounded-xl border px-4 py-3.5 flex items-center gap-3"
          style={{
            borderColor: method === 'wallet' ? 'var(--primary)' : 'var(--border)',
            background: method === 'wallet' ? 'rgba(37,99,235,.06)' : 'transparent',
            opacity: walletOk ? 1 : 0.55,
          }}
          disabled={!walletOk}
          onClick={() => setMethod('wallet')}
        >
          <img src={`/api/emoji?id=${WALLET_EMOJI_ID}`} alt="" width={20} height={20} />
          <span className="flex-1">
            <span className="font-semibold block">Wallet</span>
            <span className="text-xs" style={{ color: 'var(--fg3)' }}>
              {walletOk
                ? `Deducted from your balance when you confirm.`
                : `Balance too low — top up below.`}
            </span>
          </span>
          <b>${total.toFixed(2)}</b>
        </button>
        {methods.map((m) => (
          <button key={m.id}
            className="w-full text-left rounded-xl border px-4 py-3.5 flex items-center gap-3"
            style={{
              borderColor: method === m ? 'var(--primary)' : 'var(--border)',
              background: method === m ? 'rgba(37,99,235,.06)' : 'transparent',
            }}
            onClick={() => setMethod(m)}
          >
            <MethodIcon m={m} />
            <span className="flex-1 font-semibold"><CEText text={m.name} /></span>
            <b>${total.toFixed(2)}</b>
          </button>
        ))}
        <p className="text-xs pt-1" style={{ color: 'var(--fg3)' }}>
          Payment details appear after you confirm your method.
        </p>
        {msg && <p className="text-red-500 text-sm">{msg}</p>}
        <button className="btn-primary w-full !py-3" disabled={!method || busy}
          onClick={() => (method === 'wallet' ? buyWallet() : setStep('pay'))}>
          {busy ? 'Processing…' : 'Confirm payment method'}
        </button>
        <button className="btn-ghost w-full" onClick={() => setStep('review')}>Back</button>
      </div>
    );
  }

  /* ---------- step 3: bot-identical payment flow ---------- */
  const m = method !== 'wallet' && method ? method : null;
  if (!m) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MethodIcon m={m} />
        <h3 className="font-bold"><CEText text={m.name} /></h3>
      </div>
      <PayFlow key={m.id} method={m} presetAmount={total} onCredited={onCredited} />
      {msg && <p className="text-sm" style={{ color: 'var(--fg2)' }}>{msg}</p>}
      <button className="btn-ghost w-full" disabled={busy} onClick={() => { setStep('method'); setMsg(''); }}>Back</button>
    </div>
  );
}
