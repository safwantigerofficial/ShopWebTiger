import { requireUserOrRedirect } from '../../lib/guard';
import { listFreebies, freebieRemaining, countFreebieClaims } from '../../db/freebies';
import { countReferralsAfter } from '../../db/queries';
import FreebieCard from './FreebieCard';

export const dynamic = 'force-dynamic';

export default async function FreebiesPage() {
  const user = await requireUserOrRedirect();
  const freebies = await listFreebies(true);
  const rows = await Promise.all(
    freebies.map(async (f) => ({
      f,
      remaining: await freebieRemaining(f),
      used: await countFreebieClaims(f.id, user.telegram_id),
      refs: f.min_refs > 0 ? await countReferralsAfter(user.telegram_id, f.created_at) : 0,
    })),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">🎁 Freebies</h1>
      {rows.length === 0 && <p className="text-slate-400">No freebies live right now — check back soon.</p>}
      {rows.map(({ f, remaining, used, refs }) => (
        <FreebieCard
          key={f.id}
          freebie={{
            id: f.id,
            name: f.button_label?.trim() || f.name,
            kind: f.kind,
            description: f.description,
            buffQty: f.buff_qty ?? null,
            minRefs: f.min_refs,
            perUserLimit: f.per_user_limit,
            remaining,
            used,
            userRefs: refs,
          }}
        />
      ))}
    </div>
  );
}
