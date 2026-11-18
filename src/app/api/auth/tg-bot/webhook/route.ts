import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { confirmNonce, loginBotApi, webhookSecret } from '../../../../../lib/tgBotLogin';

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
  let reply = 'Open the website and tap “Open in Telegram app” to log in.';
  if (m) {
    reply = confirmNonce(m[1], { id: from.id, first_name: from.first_name, last_name: from.last_name, username: from.username })
      ? "✅ You're logged in to SafwanTiger web — go back to your browser."
      : '⚠️ This login link expired. Go back to the website and try again.';
  }
  await loginBotApi('sendMessage', { chat_id: msg.chat!.id, text: reply }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
