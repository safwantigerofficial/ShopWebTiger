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
  // Buy goes straight to payment selection (direct pay).
  const [step, setStep] = useState<'method' | 'pay' | 'done'>('method');
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

  const summary = (
    <div className="card !p-5 h-fit">
      <div className="font-bold">Order summary</div>
      <div className="text-sm mt-2 font-semibold">{ceText(productName)}</div>
      <div className="flex justify-between text-sm mt-4 pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--fg2)' }}>
        <span>Quantity</span><b style={{ color: 'var(--fg)' }}>{qty}</b>
      </div>
      <div className="flex justify-between items-baseline mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-sm" style={{ color: 'var(--fg2)' }}>Total</span>
        <span className="text-2xl font-extrabold">${total.toFixed(2)}</span>
      </div>
      <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost !py-2 px-4 text-sm" onClick={() => window.location.reload()}>Refresh</button>
        <Link href={`/product/${productId}`} className="btn-ghost !py-2 px-4 text-sm">Cancel order</Link>
        <button className="btn-ghost !py-2 px-4 text-sm"
          onClick={() => window.dispatchEvent(new Event('st-open-support'))}>Need help?</button>
      </div>
    </div>
  );

  /* ---------- step 2: choose how to pay ---------- */
  if (step === 'method') {
    const walletOk = balance >= total;
    const radio = (on: boolean) => (
      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: on ? 'var(--primary)' : 'var(--border2)' }}>
        {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />}
      </span>
    );
    return (
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {summary}
        <div className="card !p-5 space-y-3">
        <h3 className="font-bold">Choose how to pay</h3>
        {!walletOk && (
          <div className="rounded-xl p-3.5 text-sm"
            style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.35)' }}>
            Your wallet balance is insufficient. Add funds before confirming this payment.
            <Link href="/wallet" className="btn-ghost mt-2.5 !py-1.5 px-4 text-sm inline-block">Add funds</Link>
          </div>
        )}
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
          {radio(method === 'wallet')}
          <img src={`/api/emoji?id=${WALLET_EMOJI_ID}`} alt="" width={20} height={20} />
          <span className="flex-1 min-w-0">
            <span className="font-semibold block">Wallet</span>
            <span className="text-xs" style={{ color: 'var(--fg3)' }}>
              {walletOk
                ? `Balance $${balance.toFixed(2)} — deducted when you confirm.`
                : `Balance too low — top up below.`}
            </span>
          </span>
          <b className="shrink-0">${total.toFixed(2)}</b>
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
            {radio(method === m)}
            <MethodIcon m={m} />
            <span className="flex-1 min-w-0 font-semibold truncate"><CEText text={m.name} /></span>
            <b className="shrink-0">${total.toFixed(2)}</b>
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
        <Link href={`/product/${productId}`} className="btn-ghost w-full text-center block">Back</Link>
        </div>
      </div>
    );
  }

  /* ---------- step 3: bot-identical payment flow ---------- */
  const m = method !== 'wallet' && method ? method : null;
  if (!m) return null;
  const steps = ['Payment method', 'Transfer', 'Verify'];
  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      {summary}
      <div className="card !p-5 space-y-4">
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0"
                style={i === 1
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { border: '1.5px solid var(--border2)', color: 'var(--fg3)' }}>
                {i + 1}
              </span>
              <span className="text-[11px] sm:text-sm whitespace-nowrap" style={{ color: i === 1 ? 'var(--primary)' : 'var(--fg3)', fontWeight: i === 1 ? 700 : 500 }}>{s}</span>
            </span>
            {i < steps.length - 1 && <span className="flex-1 h-px mx-1.5 sm:mx-3" style={{ background: i === 0 ? 'var(--primary)' : 'var(--border)' }} />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <MethodIcon m={m} />
        <h3 className="font-bold"><CEText text={m.name} /></h3>
      </div>
      <PayFlow key={m.id} method={m} presetAmount={total} onCredited={onCredited} />
      {msg && <p className="text-sm" style={{ color: 'var(--fg2)' }}>{msg}</p>}
      <button className="btn-ghost w-full" disabled={busy} onClick={() => { setStep('method'); setMsg(''); }}>Back</button>
      </div>
    </div>
  );
}
