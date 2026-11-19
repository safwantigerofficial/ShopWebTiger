'use client';
import { useEffect, useRef, useState } from 'react';
import CE from './CE';

type Msg = { id: number; from_admin: boolean; body: string; created_at: string };

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [enabled, setEnabled] = useState(false);
  const lastId = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  // Probe once: only show the widget for logged-in users.
  useEffect(() => {
    fetch('/api/support/messages')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMsgs(d.messages ?? []);
          if (d.messages?.length) lastId.current = d.messages[d.messages.length - 1].id;
          setEnabled(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('st-open-support', h);
    return () => window.removeEventListener('st-open-support', h);
  }, []);

  useEffect(() => {
    if (!open || !enabled) return;
    const tick = () =>
      fetch(`/api/support/messages?after=${lastId.current}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const newer: Msg[] = d?.messages ?? [];
          if (newer.length) {
            lastId.current = newer[newer.length - 1].id;
            setMsgs((m) => [...m, ...newer]);
          }
        })
        .catch(() => {});
    tick();
    const iv = setInterval(tick, 5000);
    return () => clearInterval(iv);
  }, [open, enabled]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs, open]);

  if (!enabled) return null;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const optimistic: Msg = { id: -Date.now(), from_admin: false, body: text, created_at: new Date().toISOString() };
    setMsgs((m) => [...m, optimistic]);
    await fetch('/api/support/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: text }),
    }).catch(() => {});
  };

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 md:bottom-6 right-4 z-50 w-[min(92vw,340px)] rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,.18)', height: 420 }}
        >
          <div className="px-4 py-3 font-bold text-sm flex items-center gap-2.5" style={{ background: 'var(--primary)', color: '#fff' }}>
            <img src="/avatars/support.jpg" alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,.5)' }} />
            <div>
              <div>Support chat</div>
              <div className="text-[10px] font-medium opacity-80">We usually reply in minutes</div>
            </div>
          </div>
          <div ref={box} className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.length === 0 && (
              <div className="text-xs text-center mt-6" style={{ color: 'var(--fg3)' }}>
                Type your question — our team replies here and on Telegram.
              </div>
            )}
            {msgs.map((m) => (
              <div
                key={m.id}
                className="max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words"
                style={
                  m.from_admin
                    ? { background: 'var(--surface2)', color: 'var(--fg)' }
                    : { background: 'var(--primary)', color: '#fff', marginLeft: 'auto' }
                }
              >
                {m.body}
              </div>
            ))}
          </div>
          <div className="p-2 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              className="input flex-1 !py-2 text-sm"
              placeholder="Message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn-primary !py-2 !px-4 text-sm" onClick={send}>Send</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'var(--primary)', color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}
        aria-label="Support chat"
      >
        <CE id="5904630315946611415" size={24} />
      </button>
    </>
  );
}
