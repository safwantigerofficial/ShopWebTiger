'use client';
import { useEffect, useState } from 'react';

export const BUILTIN_AVATARS: { id: string; bg: string; emojiId?: string; img?: string }[] = [
  { id: 'tiger', bg: '#fff7ed', img: '/logo.jpg' },
  { id: 'shop', bg: '#dbeafe', emojiId: '5312361253610475399' },
  { id: 'wallet', bg: '#dcfce7', emojiId: '6267068789146260253' },
  { id: 'gem', bg: '#ede9fe', emojiId: '5265151230790884988' },
  { id: 'shield', bg: '#fee2e2', emojiId: '6052869252447215120' },
  { id: 'gear', bg: '#e0f2fe', emojiId: '5798678738384195183' },
  { id: 'star', bg: '#fef9c3', emojiId: '5854985398857503237' },
  { id: 'binance', bg: '#fef3c7', emojiId: '5875443023873053217' },
];

const KEY = 'stw_avatar';

export function readAvatarChoice(): string {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
export function saveAvatarChoice(v: string) {
  try {
    if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY);
  } catch { /* quota */ }
  window.dispatchEvent(new Event('avatar-change'));
}

/** Circle avatar: user's chosen built-in / uploaded image, else Telegram photo, else initial. */
export default function Avatar({ size = 32, name = '' }: { size?: number; name?: string }) {
  const [choice, setChoice] = useState('');
  const [tgFailed, setTgFailed] = useState(false);
  useEffect(() => {
    const upd = () => setChoice(readAvatarChoice());
    upd();
    window.addEventListener('avatar-change', upd);
    return () => window.removeEventListener('avatar-change', upd);
  }, []);
  const box = { width: size, height: size } as const;
  const b = choice.startsWith('b:') ? BUILTIN_AVATARS.find((x) => x.id === choice.slice(2)) : null;
  if (b) {
    return (
      <span className="rounded-full overflow-hidden inline-flex items-center justify-center shrink-0" style={{ ...box, background: b.bg }}>
        <img src={b.img ?? `/api/emoji?id=${b.emojiId}`} alt="" style={b.img ? box : { width: size * 0.62, height: size * 0.62 }} className="object-cover" />
      </span>
    );
  }
  if (choice.startsWith('data:image/')) {
    return <img src={choice} alt="" className="rounded-full object-cover shrink-0" style={box} />;
  }
  if (!tgFailed) {
    return <img src="/api/avatar" alt="" onError={() => setTgFailed(true)} className="rounded-full object-cover shrink-0" style={box} />;
  }
  return (
    <span className="rounded-full inline-flex items-center justify-center font-bold text-white shrink-0"
      style={{ ...box, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', fontSize: size * 0.42 }}>
      {(name.trim()[0] ?? 'U').toUpperCase()}
    </span>
  );
}
