import { NextResponse } from 'next/server';
import { takeConfirmed } from '../../../../../lib/tgBotLogin';
import { loginVerifiedUser } from '../../../../../lib/loginUser';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const nonce = new URL(req.url).searchParams.get('nonce') ?? '';
  if (!/^[0-9a-f]{32}$/.test(nonce)) return NextResponse.json({ ok: false, error: 'bad_nonce' }, { status: 400 });
  const r = takeConfirmed(nonce);
  if (r === null) return NextResponse.json({ ok: false, error: 'expired' }, { status: 410 });
  if (r === 'pending') return NextResponse.json({ ok: false, pending: true });
  const out = await loginVerifiedUser(
    { id: String(r.from.id), first_name: r.from.first_name, last_name: r.from.last_name, username: r.from.username },
    r.ref,
  );
  return NextResponse.json(out.body, { status: out.status });
}
