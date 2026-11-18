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
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // leftover Telegram markdown junk (`*`, `` ` ``, stray `_`)
    .replace(/[*`]/g, '')
    .replace(/(^|\s)_+(?=\s|$)/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

/** Unicode glyphs admins write in product text → the premium emoji
 * custom_emoji_id the bot uses for the same glyph (rendered as images). */
export const UNICODE_TO_CE_ID: Record<string, string> = {
  '✅': '5854985398857503237',
  '1️⃣': '5800923472976679740',
  '2️⃣': '5802912291942830882',
  '3️⃣': '5801094885121463194',
  '4️⃣': '5800901723262293755',
  '5️⃣': '5803336218099848042',
  '6️⃣': '5801073792537072244',
  '👎': '6267000941547885720',
  '⚠️': '6267039884016358504',
  '⚠': '6267039884016358504',
  '❌': '6052869226677410910',
  '🛡️': '6052869252447215120',
  '🛡': '6052869252447215120',
  '⌛': '4990412201614378299',
  '⏳': '4990412201614378299',
  '⏰': '4990412201614378299',
  '🚫': '6264989883241076562',
  '💵': '5431647832748612816',
  '💎': '5265151230790884988',
  '🟡': '5875443023873053217',
  '📝': '5794085322400733645',
  '⚙️': '5875418530487290014',
  '⚙': '5875418530487290014',
};
const UNICODE_RX = new RegExp(`(${Object.keys(UNICODE_TO_CE_ID).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

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
  // Split unicode emojis out of text runs → premium image tokens.
  const fine: CeToken[] = [];
  for (const t of out) {
    if (t.kind !== 'text' || !UNICODE_RX.test(t.v)) {
      UNICODE_RX.lastIndex = 0;
      fine.push(t);
      continue;
    }
    UNICODE_RX.lastIndex = 0;
    let m2: RegExpExecArray | null;
    let last2 = 0;
    while ((m2 = UNICODE_RX.exec(t.v))) {
      if (m2.index > last2) fine.push({ kind: 'text', v: t.v.slice(last2, m2.index) });
      fine.push({ kind: 'emoji', id: UNICODE_TO_CE_ID[m2[0]], fallback: m2[0] });
      last2 = m2.index + m2[0].length;
    }
    if (last2 < t.v.length) fine.push({ kind: 'text', v: t.v.slice(last2) });
  }
  return fine;
}
