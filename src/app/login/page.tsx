import { env } from '../../env';
import { getSession } from '../../lib/session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import TelegramLoginButton from './TelegramLoginButton';

export default async function LoginPage() {
  const session = await getSession();
  if (session.telegramId) redirect('/shop');
  const botId = (env.TELEGRAM_LOGIN_BOT_TOKEN ?? '').split(':')[0] ?? '';
  const siteUrl = env.SITE_URL ? `https://${env.SITE_URL.replace(/^https?:\/\//, '')}` : '';
  return (
    <div className="min-h-[72vh] flex flex-col items-center justify-center text-center">
      <img src="/logo.jpg" alt="SafwanTiger" className="w-24 h-24 rounded-3xl object-cover mb-5" />
      <h1 className="serif text-4xl sm:text-5xl font-medium tracking-tight">
        SafwanTiger <em className="not-italic text-brand">Shop</em>
      </h1>
      <p className="text-slate-400 mt-3 max-w-sm">
        Premium digital goods, instant delivery — your wallet, orders and referrals are already here.
      </p>
      <div className="mt-8">
        <Suspense>
          <TelegramLoginButton
            botUsername={env.TELEGRAM_LOGIN_BOT_USERNAME}
            botId={botId}
            siteUrl={siteUrl}
          />
        </Suspense>
      </div>
      <p className="text-xs text-slate-500 max-w-xs mt-8">
        Same account as the Telegram bot — one tap and your balance is waiting.
      </p>
    </div>
  );
}
