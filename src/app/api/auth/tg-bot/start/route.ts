import { NextResponse } from 'next/server';
import { env } from '../../../../../env';
import { siteOrigin } from '../../../../../lib/origin';
import { ensureWebhook, newNonce } from '../../../../../lib/tgBotLogin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!env.TELEGRAM_LOGIN_BOT_USERNAME || !env.TELEGRAM_LOGIN_BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { ref?: string };
  try {
    await ensureWebhook(siteOrigin());
  } catch {
    return NextResponse.json({ ok: false, error: 'webhook_failed' }, { status: 502 });
  }
  const nonce = newNonce(String(body.ref ?? '').slice(0, 64));
  const username = env.TELEGRAM_LOGIN_BOT_USERNAME.replace(/^@/, '');
  return NextResponse.json({
    ok: true,
    nonce,
    link: `https://t.me/${username}?start=login_${nonce}`,
    appLink: `tg://resolve?domain=${username}&start=login_${nonce}`,
  });
}
