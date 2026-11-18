import { NextResponse } from 'next/server';
import { env } from '../../../env';

// Proxies the Telegram premium custom-emoji image THROUGH this server
// (redirects broke on networks where api.telegram.org is blocked).
// Cached at the CDN/browser for a day; file paths expire after ~1h but
// the response body is immutable, so serving cached bytes is safe.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^\d+$/.test(id)) return new NextResponse('bad id', { status: 400 });
  const token = env.TELEGRAM_LOGIN_BOT_TOKEN;
  if (!token) return new NextResponse('no token', { status: 500 });
  try {
    const s = await fetch(`https://api.telegram.org/bot${token}/getCustomEmojiStickers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ custom_emoji_ids: [id] }),
      cache: 'no-store',
    }).then((r) => r.json());
    const sticker = s?.result?.[0];
    const fileId = sticker?.thumbnail?.file_id ?? sticker?.file_id;
    if (!fileId) return new NextResponse('not found', { status: 404 });
    const f = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`).then((r) => r.json());
    const path = f?.result?.file_path;
    if (!path) return new NextResponse('not found', { status: 404 });
    const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${path}`);
    if (!fileRes.ok || !fileRes.body) return new NextResponse('not found', { status: 404 });
    return new NextResponse(fileRes.body, {
      headers: {
        'content-type': fileRes.headers.get('content-type') ?? 'image/webp',
        'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new NextResponse('error', { status: 500 });
  }
}
