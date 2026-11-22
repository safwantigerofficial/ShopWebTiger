'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import BotText from './BotText';
import {
  openTopupMethod, submitTopupAmount, submitTopupReference, requestManualTopup, checkInvoiceTopup, resumeTopup,
  type OpenResult, type SubmitResult,
} from '../app/actions/topup';
import type { DBPaymentMethod } from '../types';
import CE from './CE';

type Stage =
  | { k: 'loading' }
  | { k: 'error'; error: string }
  | { k: 'open'; o: Extract<OpenResult, { ok: true }> }
  | { k: 'quote'; screen: string; label: string; expiresAtMs: number; payAmount: string }
  | { k: 'invoice'; screen: string; url: string; depositId: number }
  | { k: 'result'; r: Extract<SubmitResult, { ok: true }> }
  | { k: 'manual'; message: string };

function Countdown({ until }: { until: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((until - now) / 1000));
  return <span className="font-mono">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>;
}

/**
 * Bot-identical payment flow for one method. `presetAmount` pre-fills the
 * amount step (product checkout). `onCredited` fires once the wallet is credited.
 */
export default function PayFlow({ method, presetAmount, onCredited, resumeDepositId }: {
  method: { id: number; provider: string; name: string; address?: string | null };
  presetAmount?: number; onCredited?: (newBalance: number | null) => void; resumeDepositId?: number;
}) {
  const [stage, setStage] = useState<Stage>({ k: 'loading' });
  const [value, setValue] = useState(presetAmount ? presetAmount.toFixed(2) : '');
  // Reference (TXID) is a separate field — never pre-fill it with the amount.
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, start] = useTransition();

  useEffect(() => {
    setStage({ k: 'loading' }); setMsg('');
    if (resumeDepositId) {
      resumeTopup(resumeDepositId).then((o) => {
        if (!o.ok) return setStage({ k: 'error', error: o.error });
        if (o.stage === 'invoice') setStage({ k: 'invoice', screen: o.screen, url: o.invoiceUrl, depositId: o.depositId });
        else if (o.stage === 'quote') setStage({ k: 'quote', screen: o.screen, label: o.inputLabel, expiresAtMs: o.expiresAtMs, payAmount: o.payAmount });
        else if (o.input === 'none') setStage({ k: 'manual', message: o.screen });
        else setStage({ k: 'open', o: { ok: true, provider: o.provider, screen: o.screen, input: o.input, inputLabel: o.inputLabel, expiresAtMs: o.expiresAtMs } });
      });
    } else {
      openTopupMethod(method.id).then((o) => setStage(o.ok ? { k: 'open', o } : { k: 'error', error: o.error }));
    }
  }, [method.id, resumeDepositId]);

  // Direct pay: when an exact order total is preset and the method asks
  // for an amount, submit it automatically instead of asking the user.
  const autoSent = useRef(false);
  useEffect(() => {
    if (autoSent.current || !presetAmount) return;
    if (stage.k !== 'open' || stage.o.input !== 'amount') return;
    autoSent.current = true;
    submitAmount();
  }, [stage, presetAmount]);

  function submitAmount() {
    setMsg('');
    start(async () => {
      const r = await submitTopupAmount(method.id, value);
      if (!r.ok) return setMsg(r.error);
      if ('invoiceUrl' in r) setStage({ k: 'invoice', screen: r.screen, url: r.invoiceUrl, depositId: r.depositId });
      else { setStage({ k: 'quote', screen: r.screen, label: r.inputLabel, expiresAtMs: r.expiresAtMs, payAmount: r.payAmount }); setValue(''); }
    });
  }

  function submitRef() {
    setMsg('');
    start(async () => {
      const r = await submitTopupReference(ref);
      if (!r.ok) return setMsg(r.error);
      setStage({ k: 'result', r });
      if (r.status === 'credited') onCredited?.(r.newBalance ?? null);
    });
  }

  function check(depositId: number) {
    setMsg('Checking payment…');
    start(async () => {
      const r = await checkInvoiceTopup(depositId);
      if (!r.ok) return setMsg(r.error);
      setMsg(r.message);
      if (r.credited) onCredited?.(null);
    });
  }

  function manual() {
    start(async () => {
      const r = await requestManualTopup(method.id);
      if (!r.ok) return setMsg(r.error);
      setStage({ k: 'manual', message: r.message });
    });
  }

  const copy = (s: string) => navigator.clipboard?.writeText(s).then(() => setMsg('Copied <CE id="5854985398857503237" /> ')).catch(() => undefined);
  const box = 'rounded-xl border px-4 py-3';
  const boxStyle = { borderColor: 'var(--border)', background: 'var(--surface2)' } as const;

  if (stage.k === 'loading') return <p className="text-sm" style={{ color: 'var(--fg3)' }}>Loading…</p>;
  if (stage.k === 'error') return <p className="text-sm" style={{ color: 'var(--warn)' }}>{stage.error}</p>;

  if (stage.k === 'manual') return <div className={box} style={boxStyle}><BotText text={stage.message} /></div>;

  if (stage.k === 'result') {
    const color = stage.r.status === 'credited' ? 'var(--ok)' : stage.r.status === 'pending' ? 'var(--warn)' : '#ef4444';
    return (
      <div className={box} style={boxStyle}>
        <div className="font-bold" style={{ color }}>{stage.r.title}</div>
        <p className="text-sm mt-2 whitespace-pre-wrap break-all" style={{ color: 'var(--fg2)' }}>{stage.r.detail}</p>
      </div>
    );
  }

  if (stage.k === 'invoice') {
    return (
      <div className="space-y-3">
        <div className={box} style={boxStyle}><BotText text={stage.screen} /></div>
        <a href={stage.url} target="_blank" rel="noreferrer" className="btn-primary w-full block text-center"><CE id="5386367538735104399" />  Open invoice</a>
        <button className="btn-ghost w-full" disabled={busy} onClick={() => check(stage.depositId)}><CE id="5854985398857503237" />  I’ve paid / Check</button>
        {msg && <p className="text-sm" style={{ color: 'var(--fg2)' }}>{msg}</p>}
      </div>
    );
  }

  const o = stage.k === 'open' ? stage.o : null;
  const screen = stage.k === 'quote' ? stage.screen : o!.screen;
  const needs = stage.k === 'quote' ? 'reference' : o!.input;
  const label = stage.k === 'quote' ? stage.label : o!.inputLabel ?? 'Amount';
  const expires = stage.k === 'quote' ? stage.expiresAtMs : o!.expiresAtMs;
  const address = method.address;

  return (
    <div className="space-y-3">
      <div className={box} style={boxStyle}><BotText text={screen} /></div>
      {address && method.provider !== 'cryptobot' && method.provider !== 'zinipay' && method.provider !== 'manual' && (
        <button className="btn-ghost w-full" onClick={() => copy(address)}>Copy {method.provider === 'binance_pay' ? 'Pay ID' : method.provider === 'bybit_pay' ? 'Bybit ID' : 'address'}</button>
      )}
      {stage.k === 'quote' && <button className="btn-ghost w-full" onClick={() => copy(stage.payAmount.split(' ')[0])}>Copy amount ({stage.payAmount})</button>}
      {presetAmount && needs === 'reference' && stage.k === 'open' && (
        <p className="text-sm font-semibold">Send at least ${presetAmount.toFixed(2)} so the order can be paid.</p>
      )}
      {expires && <p className="text-xs" style={{ color: 'var(--fg3)' }}>Time left: <Countdown until={expires} /></p>}

      {needs === 'amount' && (
        <>
          <label className="text-sm font-semibold block">{method.provider === 'ltc' ? 'Amount (USD)' : 'Amount (USDT)'}</label>
          <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder={o?.min ? o.min.toFixed(2) : '10'} />
          <button className="btn-primary w-full" disabled={busy || !value} onClick={submitAmount}>{busy ? '…' : 'Continue'}</button>
        </>
      )}
      {needs === 'reference' && (
        <>
          <label className="text-sm font-semibold block">{label}</label>
          <input className="input font-mono !py-2 !text-sm" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Paste it here after paying" />
          <button className="btn-primary w-full" disabled={busy || !ref.trim()} onClick={submitRef}>{busy ? 'Verifying…' : 'Submit & verify'}</button>
        </>
      )}
      {needs === 'none' && (
        <button className="btn-primary w-full" disabled={busy} onClick={manual}>💸 {method.name}</button>
      )}
      {msg && <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--warn)' }}>{msg}</p>}
    </div>
  );
}
