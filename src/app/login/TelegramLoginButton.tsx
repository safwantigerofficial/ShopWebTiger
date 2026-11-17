'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TelegramLoginButton({ botUsername }: { botUsername: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const refCode = params.get('ref') ?? '';
    (window as any).onTelegramAuth = async (user: Record<string, string>) => {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...user, ref: refCode }),
      });
      if (res.ok) router.push('/shop');
      else setError('Login failed — please try again.');
    };
    const script = document.createElement('script');
    script.src = '/api/tg-widget';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    ref.current?.appendChild(script);
  }, [botUsername, router, params]);

  return (
    <div>
      <div ref={ref} />
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
