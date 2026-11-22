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

function Radio({ on }: { on: boolean }) {
  return (
    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
      style={{ borderColor: on ? 'var(--primary)' : 'var(--border2)' }}>
      {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />}
    </span>
  );
}

export default function TopupPanel({ methods, balance }: { methods: DBPaymentMethod[]; balance: number }) {
  const [method, setMethod] = useState<DBPaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const router = useRouter();
  const preset = Number(amount) > 0 ? Number(amount) : undefined;

  return (
    <div className="lg:flex lg:gap-6 lg:items-start">
      {/* Left: title + balance */}
      <div className="lg:w-[280px] shrink-0 mb-4 lg:mb-0">
        <h2 className="text-2xl font-extrabold tracking-tight">Top up</h2>
        <div className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>
          Balance <b className="text-base" style={{ color: 'var(--fg)' }}>{balance.toFixed(2)} USD</b>
        </div>
      </div>

      <div className="card !p-5 flex-1">
        {!method ? (
          <>
            <div className="font-bold">Choose an amount</div>
            <div className="text-sm font-semibold mt-3.5 mb-1.5" style={{ color: 'var(--fg2)' }}>Amount (USD)</div>
            <div className="relative">
              <input
                className="input !pr-14"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--fg3)' }}>USD</span>
            </div>
            <div className="text-sm font-semibold mt-4 mb-2" style={{ color: 'var(--fg2)' }}>Payment method</div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              {methods.map((m) => (
                <button key={m.id} onClick={() => setMethod(m)}
                  className="text-left rounded-xl border px-3.5 py-3 flex items-center gap-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
                  <Radio on={false} />
                  <MethodIcon m={m} />
                  <span className="flex-1 min-w-0 font-semibold text-sm sm:text-[15px]"><CEText text={m.name} /></span>
                </button>
              ))}
              {methods.length === 0 && <div className="text-sm col-span-2" style={{ color: 'var(--fg3)' }}>No payment methods configured. Please contact support.</div>}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--fg3)' }}>
              Payment details appear after you confirm your method.
            </p>
          </>
        ) : (
          <>
            <button onClick={() => setMethod(null)} className="text-sm mb-3 inline-flex items-center gap-1" style={{ color: 'var(--fg2)' }}>← All methods</button>
            <div className="flex items-center gap-3 mb-3"><MethodIcon m={method} /><h3 className="font-bold"><CEText text={method.name} /></h3></div>
            <PayFlow key={method.id} method={method} presetAmount={preset} onCredited={() => router.refresh()} />
          </>
        )}
      </div>
    </div>
  );
}
