'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PayFlow from '../../components/PayFlow';
import CEText from '../../components/CEText';
import CE from '../../components/CE';
import type { DBPaymentMethod } from '../../types';

const PROVIDER_ICON: Record<string, string> = {
  manual: '5794085322400733645', binance_pay: '5875443023873053217', bybit_pay: '5884161133174067365',
  usdt_trc20: '5431647832748612816', usdt_bep20: '5431647832748612816', usdt_ton: '5265151230790884988',
  ltc: '6052869252447215120', cryptobot: '5386367538735104399', zinipay: '4913863819836523928',
};

export function MethodIcon({ m }: { m: DBPaymentMethod }) {
  const id = (m as { emoji_id?: string | null }).emoji_id;
  if (id) return <img src={`/api/emoji?id=${id}`} alt="" width={22} height={22} />;
  return <CE id={PROVIDER_ICON[m.provider] ?? '5386367538735104399'} size={22} />;
}

export default function TopupPanel({ methods }: { methods: DBPaymentMethod[] }) {
  const [method, setMethod] = useState<DBPaymentMethod | null>(null);
  const router = useRouter();

  if (!method) {
    return (
      <div className="card !p-5">
        <div className="flex items-center gap-2 font-bold mb-3">
          <img src="/api/emoji?id=6043882458582095360" alt="" width={20} height={20} /> Top Up Wallet
        </div>
        <div className="text-sm mb-3" style={{ color: 'var(--fg2)' }}>Select a payment method</div>
        <div className="space-y-2">
          {methods.map((m) => (
            <button key={m.id} onClick={() => setMethod(m)}
              className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold text-[15px]"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
              <span className="flex items-center gap-3"><MethodIcon m={m} /><CEText text={m.name} /></span>
              <span className="text-xs font-normal" style={{ color: 'var(--fg3)' }}>{m.min_amount ? `min $${m.min_amount}` : ''}</span>
            </button>
          ))}
          {methods.length === 0 && <div className="text-sm" style={{ color: 'var(--fg3)' }}>No payment methods configured. Please contact support.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="card !p-5">
      <button onClick={() => setMethod(null)} className="text-sm mb-3 inline-flex items-center gap-1" style={{ color: 'var(--fg2)' }}>← All methods</button>
      <div className="flex items-center gap-3 mb-3"><MethodIcon m={method} /><h3 className="font-bold"><CEText text={method.name} /></h3></div>
      <PayFlow key={method.id} method={method} onCredited={() => router.refresh()} />
    </div>
  );
}
