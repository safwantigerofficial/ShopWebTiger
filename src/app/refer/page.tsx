import { requireUserOrRedirect } from '../../lib/guard';
import { getReferralEarnings, getReferralValueSummary } from '../../db/queries';
import { env } from '../../env';
import ConvertButton from './ConvertButton';
import CopyLink from './CopyLink';
import CE from '../../components/CE';

export const dynamic = 'force-dynamic';

const REFERRAL_USDT_PER_REF = 0.02;
const REFERRAL_MIN_CONVERT_USDT = 0.1;

export default async function ReferPage() {
  const user = await requireUserOrRedirect();
  const [earnings, valued] = await Promise.all([
    getReferralEarnings(user.telegram_id),
    getReferralValueSummary(user.telegram_id, REFERRAL_USDT_PER_REF),
  ]);
  const base = env.SITE_URL ? `https://${env.SITE_URL.replace(/^https?:\/\//, '')}` : '';
  const link = `${base}/login?ref=${user.ref_code}`;
  const availableUsd = valued?.availableUsd ?? earnings.available * REFERRAL_USDT_PER_REF;
  const canConvert = availableUsd >= REFERRAL_MIN_CONVERT_USDT;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold"><CE id="5854985398857503237" />  Refer & Earn</h1>
      <div className="card">
        <div className="text-sm text-slate-400 mb-1">Your referral link</div>
        <CopyLink link={link} />
        <p className="text-xs text-slate-500 mt-2">
          Earn ${REFERRAL_USDT_PER_REF} per verified friend who joins through your link.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card">
          <div className="text-2xl font-bold text-brand">{valued?.total ?? earnings.total}</div>
          <div className="text-xs text-slate-400">Total refs</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-brand">{valued?.available ?? earnings.available}</div>
          <div className="text-xs text-slate-400">Available</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-brand">${availableUsd.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Value</div>
        </div>
      </div>
      <ConvertButton
        canConvert={canConvert}
        minUsd={REFERRAL_MIN_CONVERT_USDT}
        availableUsd={availableUsd}
      />
    </div>
  );
}
