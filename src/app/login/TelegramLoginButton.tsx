'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

type Opt = 'device' | 'phone' | 'qr';

const OPTS: { id: Opt; label: string; icon: React.ReactNode }[] = [
  {
    id: 'device',
    label: 'Use Telegram on this device',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#8aa3b8' }}>
        <path d="M9.04 15.31l-.38 5.35c.54 0 .78-.23 1.06-.5l2.55-2.44 5.28 3.87c.97.54 1.66.26 1.92-.9L22.94 4.86c.31-1.4-.51-1.95-1.45-1.6L2.4 9.9c-1.37.53-1.35 1.29-.23 1.64l4.87 1.52 11.3-7.12c.53-.35 1.02-.16.62.19L9.04 15.31z" />
      </svg>
    ),
  },
  {
    id: 'phone',
    label: 'Log in with a phone number',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8aa3b8' }}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: 'qr',
    label: 'Scan a QR code',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8aa3b8' }}>
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
      </svg>
    ),
  },
];

export default function TelegramLoginButton({
  botId,
  siteUrl,
}: {
  botUsername: string;
  botId: string;
  siteUrl: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [opt, setOpt] = useState<Opt>('device');
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [qrLink, setQrLink] = useState('');

  const refCode = params.get('ref') ?? '';
  const oauthUrl =
    `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(botId)}` +
    `&origin=${encodeURIComponent(siteUrl)}&embed=0` +
    `&return_to=${encodeURIComponent(`${siteUrl}/api/auth/telegram${refCode ? `?ref=${refCode}` : ''}`)}`;

  async function cont() {
    setError('');
    if (opt === 'phone') {
      window.location.href = oauthUrl;
      return;
    }
    const res = await fetch('/api/auth/tg-bot/start', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: refCode }),
    }).catch(() => null);
    const j = res ? await res.json().catch(() => null) : null;
    if (!j?.ok) return setError('Telegram login is unavailable right now — try the phone option.');
    if (opt === 'qr') setQrLink(j.appLink ?? j.link);
    else window.open(j.link, '_blank');
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
    setQrLink('');
    setError('Login timed out — please try again.');
  }

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
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--surface2)' }}>
        {OPTS.map((o, i) => (
          <button key={o.id} type="button" onClick={() => setOpt(o.id)}
            className="w-full flex items-center gap-4 px-5 py-4 text-left text-[15px] font-semibold"
            style={{ borderTop: i ? '1px solid var(--border)' : undefined, color: 'var(--fg)' }}>
            {o.icon}
            <span className="flex-1">{o.label}</span>
            <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: opt === o.id ? 'var(--primary)' : 'var(--border2)' }}>
              {opt === o.id && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />}
            </span>
          </button>
        ))}
      </div>

      {qrLink && (
        <div className="rounded-2xl p-4 flex flex-col items-center gap-2 bg-white">
          <QRCodeSVG value={qrLink} size={180} includeMargin />
          <p className="text-xs text-center text-gray-600">
            Scan with your phone camera → Telegram opens → press <b>Start</b>
          </p>
        </div>
      )}

      <button type="button" onClick={cont} disabled={waiting} className="btn-primary w-64 !py-3.5 text-base !rounded-full">
        {waiting ? 'Waiting for confirmation in Telegram…' : 'Continue'}
      </button>
      {opt === 'device' && !waiting && (
        <p className="text-xs max-w-xs" style={{ color: 'var(--fg3)' }}>
          Opens Telegram — press <b>Start</b> in the bot and you&apos;re in.
        </p>
      )}
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
