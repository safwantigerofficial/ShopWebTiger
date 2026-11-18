import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { env } from '../env';
import { getUserByTelegramId } from '../db/queries';
import type { DBUser } from '../types';

export type TopupFlow = {
  provider: string;
  methodId: number;
  methodName: string;
  depositId: number;
  openedAtMs: number;
  expiresAtMs?: number;
};
export type SessionData = { telegramId?: number; topup?: TopupFlow };
export type Session = IronSession<SessionData>;

export async function getSession(): Promise<Session> {
  return getIronSession<SessionData>(await cookies(), {
    password: env.SESSION_SECRET,
    cookieName: 'stw_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    },
  });
}

/** The logged-in user's DB row, or null when not authenticated. */
export async function currentUser(): Promise<DBUser | null> {
  const session = await getSession();
  if (!session.telegramId) return null;
  return getUserByTelegramId(session.telegramId);
}

/** Same as currentUser but throws/redirects-friendly for pages that need auth. */
export async function requireUser(): Promise<DBUser | null> {
  return currentUser();
}
