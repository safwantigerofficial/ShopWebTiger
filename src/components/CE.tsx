/** Premium Telegram emoji rendered as an <img> from /api/emoji (visible to all visitors). */
export default function CE({ id, size = 16, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  return (
    <img
      src={`/api/emoji?id=${id}`}
      alt=""
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: '-0.2em', width: size, height: size, ...style }}
    />
  );
}
