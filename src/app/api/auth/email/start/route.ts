import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { findUserByEmail } from '../../../../../db/queries';
import { sendEmail } from '../../../../../lib/mailer';
import { consume, formatRetryAfter } from '../../../../../lib/rateLimit';
import { logger } from '../../../../../lib/logger';

export const dynamic = 'force-dynamic';

/** Send a 6-digit sign-in code to an email already saved on an account. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { email?: string } | null;
  const email = (body?.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }
  const rl = consume(`email-login:${email}`, 3, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: `Too many codes — try again in ${formatRetryAfter(rl.retryAfterMs)}.` }, { status: 429 });
  }
  const telegramId = await findUserByEmail(email);
  if (!telegramId) {
    // Don't reveal whether the email exists — but give a hint since this is a small shop.
    return NextResponse.json({ ok: false, error: 'No account uses this email. Save it first in My account, or log in with Telegram.' }, { status: 404 });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const session = await getSession();
  session.emailLogin = { email, code, telegramId, at: Date.now(), tries: 0 };
  await session.save();
  const sent = await sendEmail({
    to: email,
    subject: `${code} is your SafwanTiger login code`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 8px">Your login code</h2>
  <p style="color:#555">Enter this code on SafwanTiger Shop to sign in:</p>
  <div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;padding:20px;background:#f4f1ea;border-radius:12px;margin:16px 0">${code}</div>
  <p style="color:#888;font-size:12px">It expires in 10 minutes. If you didn't request it, ignore this email.</p>
</div>`,
  });
  if (!sent) {
    session.emailLogin = undefined;
    await session.save();
    logger.warn({ email }, 'email-login: send failed (RESEND_API_KEY missing?)');
    return NextResponse.json({ ok: false, error: 'Could not send the email right now — try Telegram login.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
