// Premium custom-emoji helpers shared by pages.
// `{{ce:<custom_emoji_id>|<unicode glyph>}}` markers appear inside
// DB-authored content (descriptions, notes, freebie text) — the bot
// renders them as Telegram premium emoji; on the web we swap in the
// unicode fallback.

const CE_MARKER_RX = /\{\{ce:([^|}\n]+)\|([^}\n]+)\}\}/g;

export function ceText(s: string): string {
  return s.replace(CE_MARKER_RX, (_m, _id, glyph) => glyph);
}
