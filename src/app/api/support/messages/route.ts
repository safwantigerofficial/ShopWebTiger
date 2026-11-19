import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../../../lib/session';
import { listSupportMessages, addSupportMessage } from '../../../../db/queries';
import { supportBotSend, adminChatId } from '../../../../lib/support';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ messages: [] }, { status: 401 });
  const after = Number(req.nextUrl.searchParams.get('after') ?? '0') || 0;
  const messages = await listSupportMessages(user.telegram_id, after);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { body } = (await req.json().catch(() => ({}))) as { body?: string };
  const text = (body ?? '').trim().slice(0, 1000);
  if (!text) return NextResponse.json({ ok: false }, { status: 400 });

  await addSupportMessage({ user_id: user.telegram_id, from_admin: false, body: text });

  const name =
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    (user.username ? `@${user.username}` : `User ${user.telegram_id}`);
  await supportBotSend(adminChatId(), `💬 ${name} (UID ${user.telegram_id}):\n${text}`);

  return NextResponse.json({ ok: true });
}
