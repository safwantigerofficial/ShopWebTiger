import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUserOrRedirect } from '../../../../lib/guard';
import { listPaymentMethods } from '../../../../db/queries';
import { TopupPay } from '../../TopupPanel';

export const dynamic = 'force-dynamic';

export default async function TopupMethodPage({
  params, searchParams,
}: {
  params: { methodId: string };
  searchParams: { amount?: string };
}) {
  await requireUserOrRedirect();
  const methods = await listPaymentMethods();
  const method = methods.find((m) => m.id === Number(params.methodId));
  if (!method) notFound();
  const amount = Number(searchParams.amount) > 0 ? Number(searchParams.amount) : undefined;
  return (
    <div className="max-w-xl mx-auto">
      <Link href="/wallet/topup" className="text-sm inline-flex items-center gap-1 mb-3" style={{ color: 'var(--fg2)' }}>
        ← Back to top up
      </Link>
      <TopupPay method={JSON.parse(JSON.stringify(method))} amount={amount} />
    </div>
  );
}
