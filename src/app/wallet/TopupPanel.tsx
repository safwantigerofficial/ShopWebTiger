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
      <div className="lg:w-[220px] shrink-0 mb-3 lg:mb-0">
        <h1 className="text-xl font-extrabold tracking-tight">Top up</h1>
        <div className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>
          Balance <b className="text-sm" style={{ color: 'var(--fg)' }}>{balance.toFixed(2)} USD</b>
        </div>
      </div>

      <div className="card !p-4 flex-1">
        {!method ? (
          <>
            <div className="font-bold text-sm">Choose an amount</div>
            <div className="text-xs font-semibold mt-3 mb-1" style={{ color: 'var(--fg2)' }}>Amount (USD)</div>
            <div className="relative">
              <input
                className="input !py-2 !pr-14"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--fg3)' }}>USD</span>
            </div>
            <div className="text-xs font-semibold mt-3 mb-1.5" style={{ color: 'var(--fg2)' }}>Payment method</div>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button key={m.id} onClick={() => setMethod(m)}
                  className="text-left rounded-lg border px-2.5 py-2 flex items-center gap-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
                  <Radio on={false} />
                  <MethodIcon m={m} />
                  <span className="flex-1 min-w-0 font-semibold text-[13px] leading-tight"><CEText text={m.name} /></span>
                </button>
              ))}
              {methods.length === 0 && <div className="text-sm col-span-2" style={{ color: 'var(--fg3)' }}>No payment methods configured. Please contact support.</div>}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--fg3)' }}>
              Payment details appear after you confirm your method.
            </p>
          </>
        ) : null}
      </div>
      {/* Payment details open in a popup window, not inline */}
      {method && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,.55)' }} onClick={() => setMethod(null)}>
          <div className="w-full sm:max-w-lg card !rounded-b-none sm:!rounded-b-2xl !p-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <MethodIcon m={method} />
              <h3 className="font-bold flex-1"><CEText text={method.name} /></h3>
              <button onClick={() => setMethod(null)} className="text-xl leading-none px-2" style={{ color: 'var(--fg3)' }}>×</button>
            </div>
            <PayFlow key={method.id} method={method} presetAmount={preset} onCredited={() => router.refresh()} />
          </div>
        </div>
      )}
    </div>
  );
}
