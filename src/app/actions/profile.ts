'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/session';
import {
  setUserEmail,
  findUserByEmail,
  toggleNotification,
  toggleEmailReports,
} from '../../db/queries';
import { sendWelcomeEmail } from '../../lib/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailResult = { ok: true; email: string | null } | { ok: false; error: string };

export async function saveEmail(input: string): Promise<EmailResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  const email = input.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' };
  const owner = await findUserByEmail(email);
  if (owner && owner !== user.telegram_id) {
    return { ok: false, error: 'This email is already linked to another account.' };
  }
  if (user.email === email) return { ok: true, email };
  await setUserEmail(user.telegram_id, email);
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : 'there');
  void sendWelcomeEmail({ to: email, name });
  revalidatePath('/profile');
  return { ok: true, email };
}

export async function removeEmail(): Promise<EmailResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Not logged in' };
  await setUserEmail(user.telegram_id, null);
  revalidatePath('/profile');
  return { ok: true, email: null };
}

export type NotifyField = 'stock_alert' | 'announcements' | 'wallet_alert' | 'email_reports';

export async function toggleNotify(field: NotifyField): Promise<boolean> {
  const user = await requireUser();
  if (!user) return false;
  const next =
    field === 'email_reports'
      ? await toggleEmailReports(user.telegram_id)
      : await toggleNotification(user.telegram_id, field);
  revalidatePath('/profile');
  return next;
}
