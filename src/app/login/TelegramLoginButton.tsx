'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

type Opt = 'device' | 'phone' | 'qr' | 'google' | 'email';

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
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"/>
        <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"/>
        <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76z"/>
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Log in with email',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8aa3b8' }}>
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
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
  oidc,
}: {
  botUsername: string;
  botId: string;
  siteUrl: string;
  oidc: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [opt, setOpt] = useState<Opt>('device');
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const refCode = params.get('ref') ?? '';

  useEffect(() => {
    const e = params.get('err');
    if (!e) return;
    const map: Record<string, string> = {
      google_not_configured: 'Google login is not configured yet — use Telegram or email.',
      no_account: 'No account uses that email. Save it first in My account, or log in with Telegram.',
      email: 'Could not verify your Google email.',
    };
    setError(map[e] ?? 'Login failed — please try again.');
  }, [params]);
  const oauthUrl =
    `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(botId)}` +
    `&origin=${encodeURIComponent(siteUrl)}&embed=0` +
    `&return_to=${encodeURIComponent(`${siteUrl}/api/auth/telegram${refCode ? `?ref=${refCode}` : ''}`)}`;

  async function cont() {
    setError('');
    if (opt === 'google') {
      const q = new URLSearchParams();
      if (refCode) q.set('ref', refCode);
      if (params.get('next')) q.set('next', params.get('next')!);
      window.location.href = `/api/auth/google/start?${q}`;
      return;
    }
    if (opt === 'email') {
      setBusy(true);
      if (!codeSent) {
        const res = await fetch('/api/auth/email/start', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }),
        }).catch(() => null);
        const j = res ? await res.json().catch(() => null) : null;
        setBusy(false);
        if (!j?.ok) return setError(j?.error ?? 'Could not send the code — try again.');
        setCodeSent(true);
        return;
      }
      const res = await fetch('/api/auth/email/verify', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, code: emailCode }),
      }).catch(() => null);
      const j = res ? await res.json().catch(() => null) : null;
      setBusy(false);
      if (!j?.ok) return setError(j?.error ?? 'Verification failed — try again.');
      router.push(params.get('next') || '/shop');
      router.refresh();
      return;
    }
    if (opt === 'device' || opt === 'phone' || oidc) {
      const q = new URLSearchParams();
      if (refCode) q.set('ref', refCode);
      if (params.get('next')) q.set('next', params.get('next')!);
      window.location.href = oidc ? `/api/auth/oidc/start?${q}` : oauthUrl;
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
          <button key={o.id} type="button" onClick={() => { setOpt(o.id); setCodeSent(false); setEmailCode(''); setError(''); }}
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

      {opt === 'email' && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          <input
            type="email"
            className="input !py-3 text-sm"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={codeSent}
          />
          {codeSent && (
            <input
              type="text"
              inputMode="numeric"
              className="input !py-3 text-sm text-center tracking-[0.4em] font-bold"
              placeholder="••••••"
              maxLength={6}
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
            />
          )}
          {codeSent && (
            <p className="text-xs" style={{ color: 'var(--fg3)' }}>
              Code sent to {email} — valid 10 minutes.{' '}
              <button type="button" className="underline" onClick={() => { setCodeSent(false); setEmailCode(''); }}>change email</button>
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={cont}
        disabled={waiting || busy || (opt === 'email' && (!email.trim() || (codeSent && emailCode.length !== 6)))}
        className="btn-primary w-64 !py-3.5 text-base !rounded-full"
      >
        {waiting ? 'Waiting for confirmation in Telegram…' : busy ? 'Please wait…' : opt === 'email' && codeSent ? 'Verify code' : 'Continue'}
      </button>
      {opt === 'device' && (
        <p className="text-xs max-w-xs" style={{ color: 'var(--fg3)' }}>
          Telegram asks you to confirm the login in the app.
        </p>
      )}
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
