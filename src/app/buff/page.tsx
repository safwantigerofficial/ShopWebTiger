import { requireUserOrRedirect } from '../../lib/guard';
import { ensureLoaded, getBuffEnabled, getBuffName, getBuffDescription, getBuffWarranty, getBuffUnitPrice } from '../../lib/services/settings';
import { listBuffOrders, buffStatusLabel } from '../../lib/services/buff';
import BuffPanel from './BuffPanel';

export const dynamic = 'force-dynamic';

export default async function BuffPage() {
  const user = await requireUserOrRedirect();
  await ensureLoaded();
  const enabled = getBuffEnabled();
  const orders = await listBuffOrders({ userId: user.telegram_id, limit: 20 });

  return (
    <div className="space-y-5">
      <div className="card">
        <h1 className="text-xl font-bold">🚀 {getBuffName()}</h1>
        {getBuffDescription() && <p className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">{getBuffDescription()}</p>}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-brand font-bold">
            {getBuffUnitPrice() ? `$${getBuffUnitPrice()!.toFixed(4)}/1B` : 'Price from 1B'}
          </span>
          <span className="text-amber-300/80 text-xs">🛡 {getBuffWarranty()}</span>
        </div>
      </div>

      {enabled ? (
        <BuffPanel balance={user.balance} />
      ) : (
        <div className="card text-center text-slate-400">Buff Token is turned off right now — check back later.</div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">My buff orders</h2>
        {orders.length === 0 && <p className="text-slate-500 text-sm">No buff orders yet.</p>}
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="card py-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm">#B{o.id} · {o.total_qty}B</div>
                <span className="text-xs font-semibold text-brand">{buffStatusLabel(o.status)}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ${Number(o.price_usdt).toFixed(2)} · {new Date(o.created_at).toLocaleString()}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1 whitespace-pre-wrap break-all">{o.orders_text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
