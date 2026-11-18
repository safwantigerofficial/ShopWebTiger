import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { loginBotApi } from '../../../lib/tgBotLogin';
import { env } from '../../../env';

export const dynamic = 'force-dynamic';

// Logged-in user's Telegram profile photo, proxied via the login bot.
export async function GET() {
  const session = await getSession();
  if (!session.telegramId) return new NextResponse(null, { status: 401 });
  try {
    const p = await loginBotApi('getUserProfilePhotos', { user_id: session.telegramId, limit: 1 });
    const sizes = p.result?.photos?.[0] as { file_id: string; width: number }[] | undefined;
    if (!sizes?.length) return new NextResponse(null, { status: 404 });
    const best = sizes.reduce((a, b) => (b.width <= 320 && b.width > a.width ? b : a), sizes[0]);
    const f = await loginBotApi('getFile', { file_id: best.file_id });
    const path = f.result?.file_path;
    if (!path) return new NextResponse(null, { status: 404 });
    const r = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_LOGIN_BOT_TOKEN}/${path}`);
    if (!r.ok || !r.body) return new NextResponse(null, { status: 404 });
    return new NextResponse(r.body, {
      headers: { 'content-type': r.headers.get('content-type') ?? 'image/jpeg', 'cache-control': 'private, max-age=3600' },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
