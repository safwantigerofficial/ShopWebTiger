import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Telegram Login Widget payload.
 * https://core.telegram.org/widgets/login — data_check_string is the
 * sorted key=value pairs (minus `hash`) joined by \n, HMAC-SHA256 with
 * secret = SHA256(bot_token).
 */
export function verifyTelegramLogin(
  data: Record<string, string>,
  botToken: string,
  maxAgeSeconds = 86400,
): boolean {
  const { hash, ...rest } = data;
  if (!hash || !botToken) return false;
  const dcs = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(dcs).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(hash, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const authDate = Number(rest.auth_date);
  if (!Number.isFinite(authDate)) return false;
  return Math.abs(Date.now() / 1000 - authDate) <= maxAgeSeconds;
}
