import { createHash, randomBytes } from 'node:crypto';
import { env } from '../env';

type TgFrom = { id: number; first_name?: string; last_name?: string; username?: string };
type Entry = { created: number; status: 'pending' | 'ok'; from?: TgFrom; ref: string };

const TTL_MS = 5 * 60 * 1000;
const g = globalThis as unknown as { __tgLoginNonces?: Map<string, Entry> };
const nonces: Map<string, Entry> = (g.__tgLoginNonces ??= new Map());

function sweep() {
  const now = Date.now();
  for (const [k, v] of nonces) if (now - v.created > TTL_MS) nonces.delete(k);
  while (nonces.size > 5000) nonces.delete(nonces.keys().next().value as string);
}

export function newNonce(ref: string): string {
  sweep();
  const n = randomBytes(16).toString('hex');
  nonces.set(n, { created: Date.now(), status: 'pending', ref });
  return n;
}

export function confirmNonce(n: string, from: TgFrom): boolean {
  sweep();
  const e = nonces.get(n);
  if (!e || e.status !== 'pending') return false;
  e.status = 'ok';
  e.from = from;
  return true;
}

export function takeConfirmed(n: string): { from: TgFrom; ref: string } | 'pending' | null {
  sweep();
  const e = nonces.get(n);
  if (!e) return null;
  if (e.status !== 'ok' || !e.from) return 'pending';
  nonces.delete(n);
  return { from: e.from, ref: e.ref };
}

export const webhookSecret = () =>
  createHash('sha256').update(`${env.SESSION_SECRET}:tgwh`).digest('hex').slice(0, 48);

/** Login bot only — never the main shop bot. */
export async function loginBotApi(method: string, body: Record<string, unknown> = {}) {
  const token = env.TELEGRAM_LOGIN_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_LOGIN_BOT_TOKEN not set');
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await r.json()) as { ok: boolean; result?: any; description?: string };
}

let webhookEnsuredFor = '';
export async function ensureWebhook(origin: string) {
  const url = `${origin}/api/auth/tg-bot/webhook`;
  if (webhookEnsuredFor === url) return;
  const info = await loginBotApi('getWebhookInfo');
  if (info.result?.url !== url) {
    const r = await loginBotApi('setWebhook', { url, secret_token: webhookSecret(), allowed_updates: ['message'] });
    if (!r.ok) throw new Error(r.description ?? 'setWebhook failed');
  }
  webhookEnsuredFor = url;
}
