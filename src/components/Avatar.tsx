'use client';
import { useEffect, useState } from 'react';

export const BUILTIN_AVATARS: { id: string; bg: string; emojiId?: string; img?: string }[] = [
  { id: 'tiger', bg: '#fff7ed', img: '/avatars/tiger.jpg' },
  { id: 'robot', bg: '#dbeafe', img: '/avatars/robot.jpg' },
  { id: 'astronaut', bg: '#ede9fe', img: '/avatars/astronaut.jpg' },
  { id: 'gamer', bg: '#dcfce7', img: '/avatars/gamer.jpg' },
  { id: 'ninja', bg: '#1f2937', img: '/avatars/ninja.jpg' },
  { id: 'fox', bg: '#ffedd5', img: '/avatars/fox.jpg' },
  { id: 'alien', bg: '#dcfce7', img: '/avatars/alien.jpg' },
  { id: 'king', bg: '#fef3c7', img: '/avatars/king.jpg' },
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
      style={{ ...box, background: 'linear-gradient(135deg,#14b8a6,#0f766e)', fontSize: size * 0.42 }}>
      {(name.trim()[0] ?? 'U').toUpperCase()}
    </span>
  );
}
