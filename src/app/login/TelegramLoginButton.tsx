'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TelegramLoginButton({
  botUsername,
  botId,
  siteUrl,
}: {
  botUsername: string;
  botId: string;
  siteUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);

  async function appLogin() {
    setError('');
    const res = await fetch('/api/auth/tg-bot/start', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: refCode }),
    }).catch(() => null);
    const j = res ? await res.json().catch(() => null) : null;
    if (!j?.ok) return setError('Telegram app login is unavailable right now.');
    window.open(j.link, '_blank');
    setWaiting(true);
    const until = Date.now() + 5 * 60 * 1000;
    while (Date.now() < until) {
      await new Promise((r) => setTimeout(r, 2000));
      const p = await fetch(`/api/auth/tg-bot/poll?nonce=${j.nonce}`).catch(() => null);
      if (!p) continue;
      const pj = await p.json().catch(() => null);
      if (pj?.ok) { router.push(params.get('next') || '/shop'); router.refresh(); return; }
      if (p.status === 410 || p.status >= 500) break;
    }
    setWaiting(false);
    setError('Login timed out — please try again.');
  }

  const refCode = params.get('ref') ?? '';
  const oauthUrl =
    `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(botId)}` +
    `&origin=${encodeURIComponent(siteUrl)}&embed=0` +
    `&return_to=${encodeURIComponent(`${siteUrl}/api/auth/telegram${refCode ? `?ref=${refCode}` : ''}`)}`;

  useEffect(() => {
    (window as any).onTelegramAuth = async (user: Record<string, string>) => {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...user, ref: refCode }),
      });
      if (res.ok) router.push('/shop');
      else setError('Login failed — please try again.');
    };
  }, [router, refCode]);

  return (
    <div className="flex flex-col items-center gap-3">
      <a href={oauthUrl} className="btn-primary w-64 !py-3 text-base">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M9.04 15.31l-.38 5.35c.54 0 .78-.23 1.06-.5l2.55-2.44 5.28 3.87c.97.54 1.66.26 1.92-.9L22.94 4.86c.31-1.4-.51-1.95-1.45-1.6L2.4 9.9c-1.37.53-1.35 1.29-.23 1.64l4.87 1.52 11.3-7.12c.53-.35 1.02-.16.62.19L9.04 15.31z" />
        </svg>
        Sign in with Telegram
      </a>
      <button type="button" onClick={appLogin} disabled={waiting} className="btn-ghost w-64 !py-3 text-base">
        {waiting ? 'Waiting for confirmation in Telegram…' : 'Open in Telegram app'}
      </button>
      <p className="text-xs max-w-xs" style={{ color: 'var(--fg3)' }}>
        Works even if telegram.org is blocked: tap, then press <b>Start</b> in the bot.
      </p>
      {/* Official one-tap widget — appears when telegram.org is reachable */}
      {botUsername && <div ref={ref} />}
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
