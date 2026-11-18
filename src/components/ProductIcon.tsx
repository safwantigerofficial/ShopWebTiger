// Renders a product icon: premium Telegram custom emoji image when
// `emoji_id` is set (same artwork the bot shows), else the unicode emoji.
export default function ProductIcon({
  emojiId,
  emoji,
  size = 32,
}: {
  emojiId?: string | null;
  emoji?: string | null;
  size?: number;
}) {
  if (emojiId) {
    return (
      <img
        src={`/api/emoji?id=${encodeURIComponent(emojiId)}`}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>{emoji || '🛒'}</span>;
}
