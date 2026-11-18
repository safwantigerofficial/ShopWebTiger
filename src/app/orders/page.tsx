import { requireUserOrRedirect } from '../../lib/guard';
import { listOrders } from '../../db/queries';
import OrdersList from './OrdersList';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await requireUserOrRedirect();
  const orders = await listOrders(user.telegram_id, 100);

  return (
    <div>
      <div className="text-sm font-semibold" style={{ color: 'var(--fg2)' }}>Customer area</div>
      <h1 className="text-3xl font-extrabold tracking-tight mt-1">My orders</h1>
      <OrdersList orders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}
