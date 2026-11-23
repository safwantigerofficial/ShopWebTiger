import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';

export const dynamic = 'force-dynamic';

/** Verify the 6-digit email code and open the session. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { email?: string; code?: string } | null;
  const email = (body?.email ?? '').trim().toLowerCase();
  const code = (body?.code ?? '').trim();
  const session = await getSession();
  const p = session.emailLogin;
  if (!p || p.email !== email || Date.now() - p.at > 10 * 60 * 1000) {
    return NextResponse.json({ ok: false, error: 'Code expired — request a new one.' }, { status: 400 });
  }
  p.tries += 1;
  if (p.tries > 5 || p.code !== code) {
    await session.save();
    const left = Math.max(0, 5 - p.tries);
    return NextResponse.json(
      { ok: false, error: left ? `Wrong code — ${left} tries left.` : 'Too many tries — request a new code.' },
      { status: 400 },
    );
  }
  session.emailLogin = undefined;
  session.telegramId = p.telegramId;
  await session.save();
  return NextResponse.json({ ok: true });
}
