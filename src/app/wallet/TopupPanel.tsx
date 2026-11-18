'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PayFlow from '../../components/PayFlow';
import CEText from '../../components/CEText';
import type { DBPaymentMethod } from '../../types';

const PROVIDER_ICON: Record<string, string> = {
  manual: '🧾', binance_pay: '🟡', bybit_pay: '🟠', usdt_trc20: '💵', usdt_bep20: '💵',
  usdt_ton: '💎', ltc: '⚪', cryptobot: '💠', zinipay: '🇧🇩',
};

export function MethodIcon({ m }: { m: DBPaymentMethod }) {
  const id = (m as { emoji_id?: string | null }).emoji_id;
  if (id) return <img src={`/api/emoji?id=${id}`} alt="" width={22} height={22} />;
  return <span className="text-lg">{m.emoji_unicode || PROVIDER_ICON[m.provider] || '💳'}</span>;
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
