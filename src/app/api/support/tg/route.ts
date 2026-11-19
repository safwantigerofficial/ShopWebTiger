import { NextRequest, NextResponse } from 'next/server';
import { addSupportMessage } from '../../../../db/queries';
import { supportBotSend, adminChatId } from '../../../../lib/support';
import { env } from '../../../../env';

export const dynamic = 'force-dynamic';

type TgMessage = {
  message_id: number;
  from?: { id: number };
  text?: string;
  reply_to_message?: { text?: string };
};

/**
 * Webhook for the support bot (@safwantigershopsupportbot). Admin replies
 * to a forwarded customer message get routed back to that user's web chat.
 * Register once: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<site>/api/support/tg
 */
export async function POST(req: NextRequest) {
  const update = (await req.json().catch(() => ({}))) as { message?: TgMessage };
  const msg = update.message;
  if (!msg?.from || !msg.text) return NextResponse.json({ ok: true });

  const adminId = env.ADMIN_USER_ID;
  if (msg.from.id !== adminId) {
    await supportBotSend(msg.from.id, 'This bot only relays support replies for SafwanTiger Shop.');
    return NextResponse.json({ ok: true });
  }

  const replied = msg.reply_to_message?.text ?? '';
  const m = replied.match(/UID (\d+)/);
  if (!m) {
    await supportBotSend(adminChatId(), 'Reply to a customer message (the 💬 one) to send it back to them.');
    return NextResponse.json({ ok: true });
  }

  const userId = Number(m[1]);
  await addSupportMessage({
    user_id: userId,
    from_admin: true,
    body: msg.text.slice(0, 1000),
    tg_message_id: msg.message_id,
  });
  return NextResponse.json({ ok: true });
}
