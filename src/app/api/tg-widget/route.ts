import { NextResponse } from 'next/server';

// Serve Telegram's login-widget JS same-origin so ad-blockers can't
// block the telegram.org request that renders the button.
let cached: { js: string; at: number } | null = null;

export async function GET() {
  if (!cached || Date.now() - cached.at > 3600_000) {
    const res = await fetch('https://telegram.org/js/telegram-widget.js?22', {
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return new NextResponse('widget unavailable', { status: 502 });
    cached = { js: await res.text(), at: Date.now() };
  }
  return new NextResponse(cached.js, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
