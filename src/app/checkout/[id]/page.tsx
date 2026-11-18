import { notFound, redirect } from 'next/navigation';
import { requireUserOrRedirect } from '../../../lib/guard';
import { getProduct, listPaymentMethods } from '../../../db/queries';
import { applyUserPriceToProduct } from '../../../lib/services/pricing';
import CheckoutPanel from './CheckoutPanel';

export const dynamic = 'force-dynamic';

const QTY_MAX = 100;

export default async function CheckoutPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { qty?: string };
}) {
  const user = await requireUserOrRedirect();
  const raw = await getProduct(Number(params.id));
  if (!raw || !raw.active) notFound();
  const p = await applyUserPriceToProduct(user.telegram_id, raw);
  const qty = Math.max(1, Math.min(QTY_MAX, Number(searchParams.qty) || 1));
  const methods = await listPaymentMethods();
  const preorder = !p.unlimited_stock && p.stock < qty;

  return (
    <div className="max-w-lg mx-auto">
      <div className="card !p-6">
        <CheckoutPanel
          productId={p.id}
          unitPrice={p.price}
          maxQty={p.unlimited_stock ? QTY_MAX : Math.max(p.stock, 1)}
          balance={user.balance}
          productName={p.name}
          methods={methods}
          preorder={preorder}
          qty={qty}
        />
      </div>
    </div>
  );
}
