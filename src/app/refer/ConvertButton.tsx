'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { convertReferrals } from '../actions/refer';
import CE from '../../components/CE';

export default function ConvertButton({
  canConvert, minUsd, availableUsd,
}: { canConvert: boolean; minUsd: number; availableUsd: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  return (
    <div className="card space-y-2">
      <button
        className="btn-primary w-full"
        disabled={!canConvert || busy}
        onClick={async () => {
          setBusy(true); setMsg('');
          const r = await convertReferrals();
          setBusy(false);
          if (r.ok) { setMsg(`<CE id="5854985398857503237" />  Converted ${r.refsSpent} refs → $${r.amount.toFixed(2)} wallet!`); router.refresh(); }
          else setMsg(r.error);
        }}
      >
        {busy ? 'Converting…' : `<CE id="5884161133174067365" />  Convert refs to wallet ($${availableUsd.toFixed(2)})`}
      </button>
      {!canConvert && (
        <p className="text-xs text-slate-500">Minimum ${minUsd.toFixed(2)} of referral value needed to convert.</p>
      )}
      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
