import { NextResponse } from 'next/server';
import { env } from '../../../../env';
import { verifyTelegramLogin } from '../../../../lib/tgLogin';
import { confirmNonce } from '../../../../lib/tgBotLogin';

export const dynamic = 'force-dynamic';

// Telegram login_url button lands here with the same signed fields the
// widget returns (?id&first_name&username&auth_date&hash&nonce).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const nonce = q.get('nonce') ?? '';
  const data: Record<string, string> = {};
  for (const [k, v] of q.entries()) if (k !== 'nonce') data[k] = v;
  const ok =
    /^[0-9a-f]{32}$/.test(nonce) &&
    verifyTelegramLogin(data, env.TELEGRAM_LOGIN_BOT_TOKEN) &&
    confirmNonce(nonce, {
      id: Number(data.id),
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
    });
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>SafwanTiger</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f6f7f9">
<div style="text-align:center;padding:24px">
  <div style="font-size:52px">${ok ? '✅' : '⚠️'}</div>
  <h1 style="font-size:20px;margin:12px 0 8px">${ok ? "You're logged in" : 'Login link expired'}</h1>
  <p style="color:#667">${ok ? 'Go back to your browser — you can close this tab.' : 'Return to the website and try again.'}</p>
</div></body></html>`;
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { 'content-type': 'text/html' } });
}
