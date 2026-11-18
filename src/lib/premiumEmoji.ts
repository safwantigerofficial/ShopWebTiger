// Premium custom-emoji helpers shared by pages.
// `{{ce:<custom_emoji_id>|<unicode glyph>}}` markers appear inside
// DB-authored content (descriptions, notes, freebie text) — the bot
// renders them as Telegram premium emoji; on the web we swap in the
// unicode fallback.

const CE_MARKER_RX = /\{\{ce:([^|}\n]+)\|([^}\n]+)\}\}/g;

export function ceText(s: string): string {
  return s.replace(CE_MARKER_RX, (_m, _id, glyph) => glyph);
}

/** Strips leftover Telegram-HTML tags (`<blockquote>`, `<b>`…) while
 * keeping the text content — product descriptions store them raw. */
export function plainText(s: string): string {
  return ceText(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export type CeToken =
  | { kind: 'text'; v: string }
  | { kind: 'emoji'; id: string; fallback: string };

/** Splits DB text into text runs and `{{ce:id|glyph}}` emoji tokens
 * (HTML tags stripped first) so callers can render real premium
 * emoji images inline. */
export function ceTokens(s: string): CeToken[] {
  const src = stripTags(s);
  const out: CeToken[] = [];
  const rx = new RegExp(CE_MARKER_RX.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(src))) {
    if (m.index > last) out.push({ kind: 'text', v: src.slice(last, m.index) });
    out.push({ kind: 'emoji', id: m[1], fallback: m[2] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ kind: 'text', v: src.slice(last) });
  return out;
}
