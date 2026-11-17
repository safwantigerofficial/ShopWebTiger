import { env } from '../../env';
import { getSession } from '../../lib/session';
import { redirect } from 'next/navigation';
import TelegramLoginButton from './TelegramLoginButton';

export default async function LoginPage() {
  const session = await getSession();
  if (session.telegramId) redirect('/shop');
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🐯</div>
        <h1 className="text-2xl font-bold">SafwanTiger Shop</h1>
        <p className="text-slate-400 mt-1">Log in with Telegram to access your wallet & orders</p>
      </div>
      <TelegramLoginButton botUsername={env.TELEGRAM_LOGIN_BOT_USERNAME} />
      <p className="text-xs text-slate-500 max-w-xs text-center">
        Same account as the Telegram bot — your balance, orders and referrals are already here.
      </p>
    </div>
  );
}
