import { requireUserOrRedirect } from '../../lib/guard';
import { listOrders } from '../../db/queries';
import { publicOrderId } from '../../lib/services/orderId';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await requireUserOrRedirect();
  const orders = await listOrders(user.telegram_id, 50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📦 My Orders</h1>
      {orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}
      {orders.map((o) => (
        <details key={o.id} className="card group">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold">{o.product_name} ×{o.qty}</div>
              <div className="text-xs text-slate-500">
                {publicOrderId(o)} · {new Date(o.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-brand font-bold">${Number(o.total).toFixed(2)}</div>
              <div className="text-[11px] text-slate-500 group-open:hidden">tap to view</div>
            </div>
          </summary>
          <div className="mt-3 bg-night-700 rounded-xl p-3 text-sm font-mono whitespace-pre-wrap break-all">
            {o.delivered_items ?? o.delivery ?? 'Processing…'}
          </div>
        </details>
      ))}
    </div>
  );
}
