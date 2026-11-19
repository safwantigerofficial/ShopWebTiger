import { currentUser } from '../../lib/session';
import { getProductSales, listCategories, listProducts } from '../../db/queries';
import type { DBCategory } from '../../types';
import { applyUserPriceToProducts } from '../../lib/services/pricing';
import ShopGrid from './ShopGrid';

export default async function ShopPage() {
  const user = await currentUser();
  const loggedIn = !!user;
  const categories = await listCategories();
  const sections = await Promise.all(
    categories.map(async (c) => {
      const { rows } = await listProducts(c.id, 0, 500);
      return {
        category: c,
        products: user ? await applyUserPriceToProducts(user.telegram_id, rows) : rows,
      };
    }),
  );
  // Same global order as the bot shop: pinned → in-stock → sort_order → id.
  const flat = sections
    .flatMap((s) => s.products)
    .sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1;
      const aIn = a.unlimited_stock || a.stock > 0;
      const bIn = b.unlimited_stock || b.stock > 0;
      if (aIn !== bIn) return aIn ? -1 : 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  const sales = await getProductSales(500).catch(() => []);
  const sold = Object.fromEntries(sales.filter((s) => s.product_id != null).map((s) => [s.product_id!, s.units_sold]));
  const visible = sections.filter((s) => s.products.length > 0);
  if (flat.length > 0) {
    visible.length = 0;
    visible.push({ category: categories[0] ?? ({} as DBCategory), products: flat });
  }
  const total = visible.reduce((n, s) => n + s.products.length, 0);
  // Web-only browse buckets matched on product names — no DB categories.
  const BUCKETS: { label: string; emojiId?: string; keys: string[] }[] = [
    { label: 'Capcut', keys: ['capcut'] },
    { label: 'Claude API Keys', keys: ['claude'] },
    { label: 'Codex API', keys: ['codex'] },
    { label: 'LinkedIn', keys: ['linkedin'] },
    { label: 'Muse', keys: ['muse'] },
    { label: 'ElevenLabs AI', emojiId: '6219689196722854904', keys: ['elevenlabs', 'eleven labs', '11labs'] },
    { label: 'Surfshark', emojiId: '5942950791550607146', keys: ['surfshark'] },
    { label: 'Gemini AI', emojiId: '5309903664733759148', keys: ['gemini'] },
    { label: 'ChatGPT AI', emojiId: '5796185041717433060', keys: ['chatgpt', 'chat gpt', 'openai'] },
    { label: 'Grok AI', emojiId: '5879759208307498823', keys: ['grok'] },
  ];
  const buckets = BUCKETS.map((b) => {
    const hits = flat.filter((p) => b.keys.some((k) => p.name.toLowerCase().includes(k)));
    // Icon: given premium emoji, else the first matching product's own icon.
    const first = hits.find((p) => p.emoji_id || p.emoji);
    return {
      key: b.label,
      label: b.label,
      emojiId: b.emojiId ?? first?.emoji_id ?? null,
      emoji: first?.emoji ?? null,
      keys: b.keys,
      count: hits.length,
    };
  }).filter((b) => b.count > 0);

  return (
    <div>
      <div className="text-sm font-semibold" style={{ color: 'var(--fg2)' }}>SafwanTiger</div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">The shop</h1>
          <p className="mt-1.5 text-[15px]" style={{ color: 'var(--fg2)' }}>
            Your favourite tools, in one place.
          </p>
        </div>
      </div>
      {visible.length === 0 && <p className="mt-8" style={{ color: 'var(--fg2)' }}>No products available right now.</p>}

      <ShopGrid
        sections={JSON.parse(JSON.stringify(visible))}
        buckets={buckets}
        sold={sold}
        loggedIn={loggedIn}
      />
    </div>
  );
}
