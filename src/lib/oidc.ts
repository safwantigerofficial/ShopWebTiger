import { createHash, randomBytes } from 'node:crypto';
import { env } from '../env';

export const OIDC_ISSUER = 'https://oauth.telegram.org';
export const OIDC_AUTH = 'https://oauth.telegram.org/auth';
export const OIDC_TOKEN = 'https://oauth.telegram.org/token';
export const OIDC_JWKS = 'https://oauth.telegram.org/.well-known/jwks.json';

/** Login bot's numeric id doubles as the OIDC client id unless overridden. */
export const oidcClientId = () =>
  env.TELEGRAM_OIDC_CLIENT_ID || (env.TELEGRAM_LOGIN_BOT_TOKEN.split(':')[0] ?? '');

export const oidcEnabled = () => !!(oidcClientId() && env.TELEGRAM_OIDC_CLIENT_SECRET);

export const rand = (n = 32) => randomBytes(n).toString('base64url');
export const s256 = (v: string) => createHash('sha256').update(v).digest('base64url');
