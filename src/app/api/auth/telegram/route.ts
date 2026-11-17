import { NextResponse } from 'next/server';
import { env } from '../../../../env';
import { verifyTelegramLogin } from '../../../../lib/tgLogin';
import { getOrCreateUser, getUserByRefCode } from '../../../../db/queries';
import { getSession } from '../../../../lib/session';

async function finishLogin(data: Record<string, string>, ref: string) {
  if (!verifyTelegramLogin(data, env.TELEGRAM_LOGIN_BOT_TOKEN)) {
    return { status: 401, body: { ok: false, error: 'invalid_signature' } };
  }
  const telegramId = Number(data.id);
  if (!Number.isFinite(telegramId)) {
    return { status: 400, body: { ok: false, error: 'bad_id' } };
  }
  // Referral: resolve the ?ref= code to the referrer's telegram_id.
  // getOrCreateUser validates it (not self, must exist) via resolveValidReferrer.
  let referredBy: number | null = null;
  if (ref) {
    const referrer = await getUserByRefCode(String(ref).trim()).catch(() => null);
    referredBy = referrer?.telegram_id ?? null;
  }
  await getOrCreateUser({
    telegram_id: telegramId,
    username: data.username ?? null,
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    language: 'en',
    referred_by: referredBy,
  });
  const session = await getSession();
  session.telegramId = telegramId;
  await session.save();
  return { status: 200, body: { ok: true } };
}

// Widget onauth POST.
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, string>;
  const { ref, ...data } = body;
  const r = await finishLogin(data, ref ?? '');
  return NextResponse.json(r.body, { status: r.status });
}

// OAuth redirect mode: oauth.telegram.org bounces back here with
// user fields in the query string (?id=…&hash=…&ref=…).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const data: Record<string, string> = {};
  for (const [k, v] of q.entries()) if (k !== 'ref') data[k] = v;
  const r = await finishLogin(data, q.get('ref') ?? '');
  if (r.status === 200) {
    return NextResponse.redirect(new URL('/shop', env.SITE_URL ? `https://${env.SITE_URL.replace(/^https?:\/\//, '')}` : url.origin));
  }
  return NextResponse.redirect(new URL('/login', url.origin));
}
