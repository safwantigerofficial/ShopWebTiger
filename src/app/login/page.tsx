import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import { env } from '../../env';
import { headers } from 'next/headers';
import TelegramLoginButton from './TelegramLoginButton';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();
  if (session.telegramId) redirect('/shop');
  const botId = (env.TELEGRAM_LOGIN_BOT_TOKEN ?? '').split(':')[0] ?? '';
  const host = env.SITE_URL
    ? env.SITE_URL.replace(/^https?:\/\//, '')
    : (headers().get('x-forwarded-host') ?? headers().get('host') ?? '');
  const siteUrl = host ? `https://${host}` : '';
  return (
    <div className="min-h-[70vh] flex flex-col justify-center">
      <a href="/shop" className="text-sm mb-6 inline-flex items-center gap-1 w-fit" style={{ color: 'var(--fg2)' }}>
        ← Back
      </a>
      <div className="card !p-10 max-w-xl w-full mx-auto text-center">
        <img src="/logo.jpg" alt="SafwanTiger" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold tracking-tight">Login options</h1>
        <p className="mt-2 text-[15px]" style={{ color: 'var(--fg2)' }}>
          Choose how you'd like to log in to SafwanTiger.
        </p>
        <div className="mt-6">
          <Suspense>
            <TelegramLoginButton botUsername={env.TELEGRAM_LOGIN_BOT_USERNAME} botId={botId} siteUrl={siteUrl} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
