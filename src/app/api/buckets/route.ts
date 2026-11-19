import { NextResponse } from 'next/server';
import { listCategories, listProducts } from '../../../db/queries';
import { buildBuckets } from '../../../lib/buckets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = await listCategories();
  const flat = (
    await Promise.all(categories.map((c) => listProducts(c.id, 0, 500).then((r) => r.rows)))
  ).flat();
  return NextResponse.json({ buckets: buildBuckets(flat) });
}
