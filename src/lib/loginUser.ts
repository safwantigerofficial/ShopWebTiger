import { getOrCreateUser, getUserByRefCode } from '../db/queries';
import { getSession } from './session';

/** Create/refresh the user and open a session. Caller MUST have verified `data` came from Telegram. */
export async function loginVerifiedUser(data: Record<string, string | undefined>, ref: string) {
  const telegramId = Number(data.id);
  if (!Number.isFinite(telegramId)) {
    return { status: 400, body: { ok: false, error: 'bad_id' } };
  }
  // Referral: resolve the ?ref= code to the referrer's telegram_id.
  // getOrCreateUser validates it (not self, must exist) via resolveValidReferrer.
  let referredBy: number | null = null;
  if (ref) {
    const referrer = await getUserByRefCode(String(ref).trim()).catch(() => null);
    referredBy = referrer?.telegram_id ?? null;
  }
  await getOrCreateUser({
    telegram_id: telegramId,
    username: data.username ?? null,
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    language: 'en',
    referred_by: referredBy,
  });
  const session = await getSession();
  session.telegramId = telegramId;
  await session.save();
  return { status: 200, body: { ok: true } };
}

