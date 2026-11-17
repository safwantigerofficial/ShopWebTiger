import { redirect } from 'next/navigation';
import { currentUser } from './session';
import type { DBUser } from '../types';

export async function requireUserOrRedirect(): Promise<DBUser> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}
