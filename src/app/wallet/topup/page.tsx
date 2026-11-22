import Link from 'next/link';
import { requireUserOrRedirect } from '../../../lib/guard';
import { listPaymentMethods } from '../../../db/queries';
import TopupPanel from '../TopupPanel';

export const dynamic = 'force-dynamic';

export default async function TopupPage() {
  const user = await requireUserOrRedirect();
  const methods = await listPaymentMethods();
  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/wallet" className="text-sm inline-flex items-center gap-1 mb-3" style={{ color: 'var(--fg2)' }}>
        ← Back to wallet
      </Link>
      <TopupPanel methods={methods} balance={user.balance} />
    </div>
  );
}
