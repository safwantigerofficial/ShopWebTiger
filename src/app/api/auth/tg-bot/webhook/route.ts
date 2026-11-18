import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { loginBotApi, webhookSecret } from '../../../../../lib/tgBotLogin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const got = Buffer.from(req.headers.get('x-telegram-bot-api-secret-token') ?? '');
  const want = Buffer.from(webhookSecret());
  if (got.length !== want.length || !timingSafeEqual(got, want)) {
    return new NextResponse(null, { status: 401 });
  }
  const update = (await req.json().catch(() => null)) as {
    message?: { text?: string; chat?: { id: number; type?: string }; from?: { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string } };
  } | null;
  const msg = update?.message;
  const from = msg?.from;
  if (!msg?.text || !from || from.is_bot || msg.chat?.type !== 'private') return NextResponse.json({ ok: true });
  const m = msg.text.trim().match(/^\/start(?:@\w+)?\s+login_([0-9a-f]{32})$/);
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const origin = host ? `${proto}://${host}` : '';
  if (m && origin) {
    const nonce = m[1];
    await loginBotApi('sendMessage', {
      chat_id: msg.chat!.id,
      text: 'Tap the button to log in to SafwanTiger web:',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Log in to SafwanTiger', login_url: { url: `${origin}/api/auth/tg-link?nonce=${nonce}` } },
        ]],
      },
    }).catch(() => undefined);
  } else {
    await loginBotApi('sendMessage', {
      chat_id: msg.chat!.id,
      text: m ? '⚠️ This login link expired. Go back to the website and try again.'
              : 'Open the website and tap “Use Telegram on this device” to log in.',
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
