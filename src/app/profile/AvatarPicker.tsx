'use client';
import { useRef } from 'react';
import Avatar, { BUILTIN_AVATARS, saveAvatarChoice } from '../../components/Avatar';

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d')!;
  const r = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - r) / 2, (img.height - r) / 2, r, r, 0, 0, s, s);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.85);
}

export default function AvatarPicker({ name }: { name: string }) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="card !p-5 mt-5">
      <div className="flex items-center gap-4">
        <Avatar size={64} name={name} />
        <div>
          <div className="font-bold">Profile picture</div>
          <div className="text-sm" style={{ color: 'var(--fg2)' }}>Your Telegram photo is used by default.</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5 mt-4">
        {BUILTIN_AVATARS.map((b) => (
          <button key={b.id} type="button" onClick={() => saveAvatarChoice(`b:${b.id}`)}
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border"
            style={{ background: b.bg, borderColor: 'var(--border)' }}>
            <img src={b.img ?? `/api/emoji?id=${b.emojiId}`} alt="" className={b.img ? 'w-12 h-12 object-cover' : 'w-7 h-7'} />
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" className="btn-primary !py-2.5 text-sm flex-1" onClick={() => file.current?.click()}>
          Upload from gallery
        </button>
        <button type="button" className="btn-ghost !py-2.5 text-sm flex-1" onClick={() => saveAvatarChoice('')}>
          Use Telegram photo
        </button>
      </div>
      <input ref={file} type="file" accept="image/*" className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) saveAvatarChoice(await shrink(f));
          e.target.value = '';
        }} />
      <p className="text-xs mt-2" style={{ color: 'var(--fg3)' }}>Saved on this device only.</p>
    </div>
  );
}
