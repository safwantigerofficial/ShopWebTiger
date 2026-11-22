import { requireUserOrRedirect } from '../../lib/guard';
import { getProduct, listOrders } from '../../db/queries';
import type { Tutorial } from '../../components/UsingMethod';
import OrdersList from './OrdersList';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await requireUserOrRedirect();
  const orders = await listOrders(user.telegram_id, 100);
  const tutorials: Record<number, Tutorial> = {};
  await Promise.all(
    Array.from(new Set(orders.map((o) => o.product_id).filter((x): x is number => x != null))).map(async (id) => {
      const p = await getProduct(id).catch(() => null);
      if (p) tutorials[id] = { text: p.tutorial_text, url: p.tutorial_url, fileId: p.tutorial_file_id, fileType: p.tutorial_file_type };
    }),
  );

  return (
    <div>
      <div className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--fg2)' }}>Customer area</div>
      <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight mt-1">My orders</h1>
      <OrdersList orders={JSON.parse(JSON.stringify(orders))} tutorials={tutorials} />
    </div>
  );
}
