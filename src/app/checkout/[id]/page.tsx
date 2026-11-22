import { notFound, redirect } from 'next/navigation';
import { requireUserOrRedirect } from '../../../lib/guard';
import { getProduct, listPaymentMethods } from '../../../db/queries';
import { applyUserPriceToProduct } from '../../../lib/services/pricing';
import CheckoutPanel from './CheckoutPanel';
import CEText from '../../../components/CEText';

export const dynamic = 'force-dynamic';

const QTY_MAX = 100;

export default async function CheckoutPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { qty?: string; m?: string };
}) {
  const user = await requireUserOrRedirect();
  const raw = await getProduct(Number(params.id));
  if (!raw || !raw.active) notFound();
  const p = await applyUserPriceToProduct(user.telegram_id, raw);
  const qty = Math.max(1, Math.min(QTY_MAX, Number(searchParams.qty) || 1));
  const methods = await listPaymentMethods();
  const ceTitle = p.name;
  const preorder = !p.unlimited_stock && p.stock < qty;

  return (
    <div className="max-w-5xl mx-auto pb-16 sm:pb-0">
      <h1 className="text-base sm:text-xl font-extrabold tracking-tight mb-3 break-words"><CEText text={ceTitle} /></h1>
        <CheckoutPanel
          productId={p.id}
          unitPrice={p.price}
          maxQty={p.unlimited_stock ? QTY_MAX : Math.max(p.stock, 1)}
          balance={user.balance}
          productName={p.name}
          methods={methods}
          preorder={preorder}
          qty={qty}
          methodId={Number(searchParams.m) || undefined}
          tutorial={{ text: p.tutorial_text, url: p.tutorial_url, fileId: p.tutorial_file_id, fileType: p.tutorial_file_type }}
        />
    </div>
  );
}
