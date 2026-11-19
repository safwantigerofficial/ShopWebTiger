import type { DBProduct } from '../types';

// Web-only browse buckets matched on product names — no DB categories.
export const BUCKET_DEFS: { label: string; emojiId?: string; keys: string[] }[] = [
  { label: 'Capcut', keys: ['capcut'] },
  { label: 'Claude API Keys', keys: ['claude'] },
  { label: 'Codex API', keys: ['codex'] },
  { label: 'LinkedIn', keys: ['linkedin'] },
  { label: 'Muse', keys: ['muse'] },
  { label: 'ElevenLabs AI', emojiId: '6219689196722854904', keys: ['elevenlabs', 'eleven labs', '11labs'] },
  { label: 'Surfshark', emojiId: '5942950791550607146', keys: ['surfshark'] },
  { label: 'Gemini AI', emojiId: '5309903664733759148', keys: ['gemini'] },
  { label: 'ChatGPT AI', emojiId: '5796185041717433060', keys: ['chatgpt', 'chat gpt', 'openai'] },
  { label: 'Grok AI', emojiId: '5879759208307498823', keys: ['grok'] },
];

export type Bucket = {
  key: string;
  label: string;
  emojiId: string | null;
  emoji: string | null;
  keys: string[];
  count: number;
};

export function buildBuckets(flat: DBProduct[]): Bucket[] {
  return BUCKET_DEFS.map((b) => {
    const hits = flat.filter((p) => b.keys.some((k) => p.name.toLowerCase().includes(k)));
    // Icon: given premium emoji, else the first matching product's own icon.
    const first = hits.find((p) => p.emoji_id || p.emoji);
    return {
      key: b.label,
      label: b.label,
      emojiId: b.emojiId ?? first?.emoji_id ?? null,
      emoji: first?.emoji ?? null,
      keys: b.keys,
      count: hits.length,
    };
  }).filter((b) => b.count > 0);
}
