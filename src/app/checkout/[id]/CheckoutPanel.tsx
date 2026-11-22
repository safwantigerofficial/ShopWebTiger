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
const STEPS = ['Payment method', 'Transfer', 'Verify'];

function Radio({ on }: { on: boolean }) {
  return (
    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
      style={{ borderColor: on ? 'var(--primary)' : 'var(--border2)' }}>
      {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />}
    </span>
  );
}

function Tabs({ active }: { active: number }) {
  return (
    <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5 py-2 mr-5 last:mr-0 text-[12px] sm:text-sm whitespace-nowrap"
          style={{
            color: i === active ? 'var(--primary)' : 'var(--fg3)',
            fontWeight: i === active ? 700 : 500,
            borderBottom: i === active ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -1,
          }}>
          <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
            style={i === active
              ? { background: 'var(--primary)', color: '#fff' }
              : { border: '1.5px solid var(--border2)', color: 'var(--fg3)' }}>
            {i + 1}
          </span>
          {s}
        </div>
      ))}
    </div>
  );
}

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
  const [result, setResult] = useState<
    | { ok: true; orderPublicId: string; items: string[]; pending: boolean; newBalance: number }
    | { ok: false; error: string }
    | null
  >(null);
  const total = Math.round(unitPrice * qty * 100) / 100;

  const copyItems = () => {
    if (!result?.ok || !result.items.length) return;
    navigator.clipboard.writeText(result.items.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

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
      <div className="card !p-5 space-y-3 max-w-lg">
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
    <div className="card !p-5 h-fit lg:w-[320px] shrink-0">
      <div className="font-bold">Order summary</div>
      <div className="flex justify-between text-sm mt-4" style={{ color: 'var(--fg2)' }}>
        <span>Quantity</span><b style={{ color: 'var(--fg)' }}>{qty}</b>
      </div>
      <div className="flex justify-between items-baseline mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-sm" style={{ color: 'var(--fg2)' }}>Total</span>
        <span className="text-3xl font-extrabold">${total.toFixed(2)}</span>
      </div>
    </div>
  );

  const actions = (
    <div className="flex flex-wrap gap-2 pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <button className="btn-ghost !py-2 px-4 text-sm" onClick={() => window.location.reload()}>Refresh</button>
      <Link href={`/product/${productId}`} className="btn-ghost !py-2 px-4 text-sm">Cancel order</Link>
      <button className="btn-ghost !py-2 px-4 text-sm"
        onClick={() => window.dispatchEvent(new Event('st-open-support'))}>Need help?</button>
    </div>
  );

  /* ---------- step 1: choose how to pay ---------- */
  if (step === 'method') {
    const walletOk = balance >= total;
    return (
      <div className="lg:flex lg:gap-6 lg:items-start">
        {summary}
        <div className="card !p-5 flex-1 mt-4 lg:mt-0 pb-20 sm:pb-5">
          <div className="font-bold text-lg">Your order</div>
          <div className="mt-3"><Tabs active={0} /></div>
          <div className="font-semibold mt-4 mb-2.5 text-sm sm:text-base">Choose how to pay</div>
          {!walletOk && (
            <div className="rounded-xl p-3 text-sm mb-2.5"
              style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.35)' }}>
              Your wallet balance is insufficient. Add funds before confirming this payment.
              <Link href="/wallet/topup" className="btn-ghost mt-2 !py-1 px-3 text-xs inline-block">Add funds</Link>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2.5">
            <button
              className="text-left rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{
                borderColor: method === 'wallet' ? 'var(--primary)' : 'var(--border)',
                background: method === 'wallet' ? 'rgba(37,99,235,.06)' : 'transparent',
                opacity: walletOk ? 1 : 0.55,
              }}
              disabled={!walletOk}
              onClick={() => setMethod('wallet')}
            >
              <Radio on={method === 'wallet'} />
              <img src={`/api/emoji?id=${WALLET_EMOJI_ID}`} alt="" width={20} height={20} />
              <span className="flex-1 min-w-0 font-semibold">Wallet</span>
              {walletOk
                ? <span className="text-xs shrink-0" style={{ color: 'var(--fg3)' }}>${balance.toFixed(2)}</span>
                : <span className="text-xs shrink-0" style={{ color: 'var(--fg3)' }}>top up</span>}
            </button>
            {methods.map((m) => (
              <button key={m.id}
                className="text-left rounded-xl border px-4 py-3 flex items-center gap-3"
                style={{
                  borderColor: method === m ? 'var(--primary)' : 'var(--border)',
                  background: method === m ? 'rgba(37,99,235,.06)' : 'transparent',
                }}
                onClick={() => setMethod(m)}
              >
                <Radio on={method === m} />
                <MethodIcon m={m} />
                <span className="flex-1 min-w-0 font-semibold"><CEText text={m.name} /></span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--fg3)' }}>
            Payment details appear after you confirm your method.
          </p>
          {msg && <p className="text-red-500 text-sm mt-2">{msg}</p>}
          {/* Desktop: right-aligned confirm. Mobile: sticky bottom bar. */}
          <div className="hidden sm:flex justify-end mt-4">
            <button className="btn-primary !px-8" disabled={!method || busy}
              onClick={() => (method === 'wallet' ? buyWallet() : setStep('pay'))}>
              {busy ? 'Processing…' : 'Confirm payment method'}
            </button>
          </div>
          <div className="sm:hidden fixed left-0 right-0 bottom-[64px] z-40 px-4 pb-2"
            style={{ background: 'linear-gradient(to top, var(--bg) 75%, transparent)' }}>
            <button className="btn-primary w-full !py-3.5 font-bold" disabled={!method || busy}
              onClick={() => (method === 'wallet' ? buyWallet() : setStep('pay'))}>
              {busy ? 'Processing…' : 'Confirm payment method'}
            </button>
          </div>
          {actions}
        </div>
      </div>
    );
  }

  /* ---------- step 2: transfer & verify (popup window) ---------- */
  const m = method !== 'wallet' && method ? method : null;
  if (!m) return null;
  return (
    <div className="lg:flex lg:gap-6 lg:items-start">
      {summary}
      <div className="card !p-5 flex-1 mt-4 lg:mt-0 space-y-4">
        <div className="font-bold text-lg">Your order</div>
        <Tabs active={1} />
        {msg && <p className="text-sm" style={{ color: 'var(--fg2)' }}>{msg}</p>}
      </div>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,.55)' }} onClick={() => { if (!busy) { setStep('method'); setMsg(''); } }}>
        <div className="w-full sm:max-w-lg card !rounded-b-none sm:!rounded-b-2xl !p-5 max-h-[92vh] overflow-y-auto space-y-4"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <MethodIcon m={m} />
            <h3 className="font-bold flex-1"><CEText text={m.name} /></h3>
            <button onClick={() => { setStep('method'); setMsg(''); }} disabled={busy}
              className="text-xl leading-none px-2" style={{ color: 'var(--fg3)' }}>×</button>
          </div>
          <PayFlow key={m.id} method={m} presetAmount={total} onCredited={onCredited} />
          {actions}
        </div>
      </div>
    </div>
  );
}
