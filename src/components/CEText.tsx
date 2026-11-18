import { ceTokens } from '../lib/premiumEmoji';

// Renders DB text with `{{ce:id|glyph}}` premium-emoji markers as
// inline emoji images (same artwork Telegram shows), tags stripped.
export default function CEText({ text, size = 15 }: { text: string; size?: number }) {
  const tokens = ceTokens(text);
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === 'text' ? (
          <span key={i}>{t.v}</span>
        ) : (
          <img
            key={i}
            src={`/api/emoji?id=${encodeURIComponent(t.id)}`}
            alt={t.fallback}
            width={size}
            height={size}
            style={{
              display: 'inline-block',
              verticalAlign: '-0.18em',
              width: size,
              height: size,
            }}
          />
        ),
      )}
    </>
  );
}
