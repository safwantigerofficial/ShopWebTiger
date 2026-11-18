import CEText from './CEText';

/** Renders the bot's Telegram-markdown copy (*bold*, _italic_, `code`) with premium emoji markers. */
function inline(line: string, key: string) {
  const parts = line.split(/(`[^`]+`|\*[^*]+\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    const k = `${key}-${i}`;
    if (/^`[^`]+`$/.test(p)) return <code key={k} className="font-mono text-[13px] px-1.5 py-0.5 rounded break-all" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>{p.slice(1, -1)}</code>;
    if (/^\*[^*]+\*$/.test(p)) return <b key={k}>{inline(p.slice(1, -1), k)}</b>;
    if (/^_[^_]+_$/.test(p)) return <i key={k} style={{ color: 'var(--fg2)' }}>{inline(p.slice(1, -1), k)}</i>;
    return <CEText key={k} text={p} />;
  });
}

export default function BotText({ text }: { text: string }) {
  return (
    <div className="text-[14px] leading-relaxed space-y-0.5">
      {text.split('\n').map((l, i) => (l.trim() === '' ? <div key={i} className="h-2" /> : <div key={i}>{inline(l, String(i))}</div>))}
    </div>
  );
}
