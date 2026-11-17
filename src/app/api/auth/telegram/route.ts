import { NextResponse } from 'next/server';
import { env } from '../../../../env';
import { verifyTelegramLogin } from '../../../../lib/tgLogin';
import { getOrCreateUser } from '../../../../db/queries';
import { getSession } from '../../../../lib/session';

export async function POST(req: Request) {
  const data = (await req.json()) as Record<string, string>;
  if (!verifyTelegramLogin(data, env.TELEGRAM_LOGIN_BOT_TOKEN)) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }
  const telegramId = Number(data.id);
  if (!Number.isFinite(telegramId)) {
    return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 });
  }
  await getOrCreateUser({
    telegram_id: telegramId,
    username: data.username ?? null,
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    language: 'en',
  });
  const session = await getSession();
  session.telegramId = telegramId;
  await session.save();
  return NextResponse.json({ ok: true });
}
