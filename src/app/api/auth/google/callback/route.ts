import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getSession } from '../../../../../lib/session';
import { findUserByEmail } from '../../../../../db/queries';
import { logger } from '../../../../../lib/logger';

export const dynamic = 'force-dynamic';

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

/** Google redirects here with ?code&state. We verify the id_token and match the email to an account. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  const fail = (e: string) => NextResponse.redirect(new URL(`/login?err=${e}`, origin));

  const session = await getSession();
  const p = session.googleOidc;
  session.googleOidc = undefined;
  await session.save();
  const code = url.searchParams.get('code');
  if (!p || !code || url.searchParams.get('state') !== p.state || Date.now() - p.at > 10 * 60 * 1000) {
    return fail('state');
  }

  let idToken: string | undefined;
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: p.redirectUri,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });
    const j = (await r.json().catch(() => null)) as { id_token?: string; error?: string } | null;
    if (!r.ok || !j?.id_token) {
      logger.warn({ status: r.status, error: j?.error }, 'google token exchange failed');
      return fail('token');
    }
    idToken = j.id_token;
  } catch (err) {
    logger.warn({ err }, 'google token request failed');
    return fail('token');
  }

  let claims: Record<string, unknown>;
  try {
    const v = await jwtVerify(idToken, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    claims = v.payload as Record<string, unknown>;
  } catch (err) {
    logger.warn({ err }, 'google id_token invalid');
    return fail('token');
  }
  if (claims.nonce !== p.nonce) return fail('nonce');

  const email = String(claims.email ?? '').toLowerCase();
  if (!email || claims.email_verified !== true) return fail('email');
  const telegramId = await findUserByEmail(email);
  if (!telegramId) return fail('no_account');
  session.telegramId = telegramId;
  await session.save();
  return NextResponse.redirect(new URL(p.next, origin));
}
