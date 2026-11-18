import { NextResponse } from 'next/server';
import { env } from '../../../env';

// Serves the static thumbnail of a Telegram premium custom emoji by
// custom_emoji_id (same stickers the bot renders). Falls back 404.
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
      next: { revalidate: 86400 },
    }).then((r) => r.json());
    const sticker = s?.result?.[0];
    const fileId = sticker?.thumbnail?.file_id ?? sticker?.file_id;
    if (!fileId) return new NextResponse('not found', { status: 404 });
    const f = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`).then((r) => r.json());
    const path = f?.result?.file_path;
    if (!path) return new NextResponse('not found', { status: 404 });
    return NextResponse.redirect(`https://api.telegram.org/file/bot${token}/${path}`);
  } catch {
    return new NextResponse('error', { status: 500 });
  }
}
