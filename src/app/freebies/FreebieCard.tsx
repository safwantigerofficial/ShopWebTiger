'use client';
import { useState } from 'react';
import { claimFreebieAction, quoteBuffFreebieAction, claimBuffFreebieAction } from '../actions/freebies';
import CE from '../../components/CE';

type F = {
  id: number; name: string; kind: string; description: string | null;
  buffQty: number | null; minRefs: number; perUserLimit: number;
  remaining: number | null; used: number; userRefs: number;
};

export default function FreebieCard({ freebie: f }: { freebie: F }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState<{ code: string; qty: number } | null>(null);

  const locked = f.minRefs > 0 && f.userRefs < f.minRefs;
  const out = f.remaining !== null && f.remaining <= 0;
  const limitHit = f.perUserLimit > 0 && f.used >= f.perUserLimit;

  async function claim() {
    setBusy(true); setErr('');
    const r = await claimFreebieAction(f.id);
    setBusy(false);
    if (r.ok) setDone(r.delivered ?? 'Claimed!');
    else setErr(r.error);
  }

  async function quote() {
    setBusy(true); setErr('');
    const r = await quoteBuffFreebieAction(f.id, code);
    setBusy(false);
    if (r.ok) setConfirm({ code: r.code, qty: r.qty });
    else setErr(r.error);
  }

  async function confirmClaim() {
    setBusy(true); setErr('');
    const r = await claimBuffFreebieAction(f.id, code);
    setBusy(false);
    if (r.ok) setDone(`Buff order #B${r.buffOrderId} placed — tokens arrive in ~1-2 min.`);
    else { setErr(r.error); setConfirm(null); }
  }

  if (done) {
    return (
      <div className="card">
        <div className="font-semibold">🎁 {f.name}</div>
        <div className="mt-2 bg-night-700 rounded-xl p-3 text-sm font-mono whitespace-pre-wrap break-all text-green-300">{done}</div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">🎁 {f.name}</div>
          {f.description && <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{f.description}</p>}
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">
          {f.minRefs > 0 ? `${f.minRefs} refs` : 'Free'} · {f.remaining === null ? '∞' : `${f.remaining} left`}
        </span>
      </div>
      {f.minRefs > 0 && (
        <div className="text-xs text-slate-400">
          Required refs: <b className={locked ? 'text-amber-400' : 'text-green-400'}>{f.userRefs}/{f.minRefs}</b> (new invites since this went live)
        </div>
      )}
      {f.perUserLimit > 0 && <div className="text-xs text-slate-500">Your claims: {f.used}/{f.perUserLimit}</div>}

      {f.buffQty && !locked && !out && !limitHit && !confirm && (
        <div className="space-y-2">
          <input className="input" placeholder="Your Muse AI invite code" value={code}
            onChange={(e) => setCode(e.target.value)} />
          <button className="btn-primary w-full" disabled={busy || !code.trim()} onClick={quote}>
            {busy ? 'Checking…' : `Get ${f.buffQty}B Buff Token`}
          </button>
        </div>
      )}
      {confirm && (
        <div className="bg-night-700 rounded-xl p-3 text-sm space-y-2">
          <p>You will send <b>{confirm.qty}B Buff Token</b> to invite code:</p>
          <p className="font-mono text-brand">{confirm.code}</p>
          <p className="text-amber-300 text-xs">⚠️ Make sure the code is yours — tokens go straight to that account.</p>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={busy} onClick={confirmClaim}>
              {busy ? 'Placing…' : '<CE id="5854985398857503237" />  Confirm'}
            </button>
            <button className="btn-ghost flex-1" onClick={() => setConfirm(null)}><CE id="6052869226677410910" />  Cancel</button>
          </div>
        </div>
      )}
      {!f.buffQty && (
        <button className="btn-primary w-full" disabled={busy || locked || out || limitHit} onClick={claim}>
          {locked ? `<CE id="6052869252447215120" />  Invite ${f.minRefs - f.userRefs} more friend(s)` : out ? 'Out of stock' : limitHit ? 'Limit reached' : busy ? 'Claiming…' : '<CE id="5854985398857503237" />  Claim free'}
        </button>
      )}
      {f.buffQty && (locked || out || limitHit) && (
        <button className="btn-primary w-full" disabled>
          {locked ? `<CE id="6052869252447215120" />  Invite ${f.minRefs - f.userRefs} more friend(s)` : out ? 'Out of stock' : 'Limit reached'}
        </button>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
