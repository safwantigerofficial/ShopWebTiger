'use client';
import { useState, useTransition } from 'react';
import { saveEmail, removeEmail, toggleNotify, type NotifyField } from '../actions/profile';
import CE from '../../components/CE';

const TOGGLES: { field: NotifyField; label: string; sub: string; icon: string }[] = [
  { field: 'announcements', label: 'Announcements', sub: 'New products & shop news', icon: '5312361253610475399' },
  { field: 'stock_alert', label: 'Stock alerts', sub: 'Restock notifications', icon: '5893255507380014983' },
  { field: 'wallet_alert', label: 'Wallet alerts', sub: 'Balance & payment updates', icon: '6028517788606272241' },
  { field: 'email_reports', label: 'Email reports', sub: 'Invoices & reports to your email', icon: '5318845185348626090' },
];

export default function EmailSettings({
  initialEmail,
  toggles,
}: {
  initialEmail: string | null;
  toggles: Record<NotifyField, boolean>;
}) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [saved, setSaved] = useState(initialEmail ?? '');
  const [states, setStates] = useState(toggles);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="card !p-5 mt-5">
      <div className="font-bold">Email &amp; notifications</div>
      <div className="text-sm mt-0.5" style={{ color: 'var(--fg2)' }}>
        Save your email to get order invoices and reports — same as the bot.
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input
          className="input flex-1 !py-2.5 text-sm"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary !py-2.5 !px-5 text-sm"
          disabled={pending || !email.trim()}
          onClick={() =>
            start(async () => {
              const r = await saveEmail(email);
              setMsg(r.ok ? { ok: true, text: 'Saved — check your inbox for a confirmation email.' } : { ok: false, text: r.error });
              if (r.ok) setSaved(r.email ?? '');
            })
          }
        >
          {saved ? 'Update' : 'Save'}
        </button>
        {saved && (
          <button
            type="button"
            className="btn-ghost !py-2.5 !px-5 text-sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await removeEmail();
                setSaved('');
                setEmail('');
                setMsg({ ok: true, text: 'Email removed.' });
              })
            }
          >
            Remove
          </button>
        )}
      </div>
      {msg && (
        <div className="text-xs mt-2" style={{ color: msg.ok ? 'var(--green, #16a36a)' : '#dc2626' }}>{msg.text}</div>
      )}

      <div className="mt-5 space-y-2">
        {TOGGLES.map((t) => (
          <button
            key={t.field}
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const next = await toggleNotify(t.field);
                setStates((s) => ({ ...s, [t.field]: next }));
              })
            }
            className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <CE id={t.icon} size={18} />
              <div>
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-xs" style={{ color: 'var(--fg3)' }}>{t.sub}</div>
              </div>
            </div>
            <span
              className="w-10 h-6 rounded-full relative transition-colors shrink-0"
              style={{ background: states[t.field] ? 'var(--primary)' : 'var(--border2, #d1d5db)' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: states[t.field] ? '18px' : '2px' }}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
