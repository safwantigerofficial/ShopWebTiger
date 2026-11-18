import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../../../../env';
import { getSession } from '../../../../../lib/session';
import { loginVerifiedUser } from '../../../../../lib/loginUser';
import { OIDC_ISSUER, OIDC_JWKS, OIDC_TOKEN, oidcClientId } from '../../../../../lib/oidc';
import { logger } from '../../../../../lib/logger';

export const dynamic = 'force-dynamic';

const JWKS = createRemoteJWKSet(new URL(OIDC_JWKS));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  const fail = (e: string) => NextResponse.redirect(new URL(`/login?err=${e}`, origin));

  const session = await getSession();
  const p = session.oidc;
  session.oidc = undefined;
  await session.save();
  const code = url.searchParams.get('code');
  if (!p || !code || url.searchParams.get('state') !== p.state || Date.now() - p.at > 10 * 60 * 1000) {
    return fail('state');
  }

  const clientId = oidcClientId();
  let idToken: string | undefined;
  try {
    const r = await fetch(OIDC_TOKEN, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${Buffer.from(`${clientId}:${env.TELEGRAM_OIDC_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: p.redirectUri,
        client_id: clientId,
        code_verifier: p.verifier,
      }),
    });
    const j = (await r.json().catch(() => null)) as { id_token?: string; error?: string } | null;
    if (!r.ok || !j?.id_token) {
      logger.warn({ status: r.status, error: j?.error }, 'telegram oidc token exchange failed');
      return fail('token');
    }
    idToken = j.id_token;
  } catch (err) {
    logger.warn({ err }, 'telegram oidc token request failed');
    return fail('token');
  }

  let claims: Record<string, unknown>;
  try {
    const v = await jwtVerify(idToken, JWKS, { issuer: OIDC_ISSUER, audience: clientId });
    claims = v.payload as Record<string, unknown>;
  } catch (err) {
    logger.warn({ err }, 'telegram oidc id_token invalid');
    return fail('token');
  }
  if (claims.nonce !== p.nonce) return fail('nonce');

  const id = String(claims.id ?? claims.sub ?? '');
  if (!/^\d+$/.test(id)) return fail('id');
  const name = String(claims.name ?? '').trim();
  const [first, ...rest] = name.split(/\s+/);
  const r = await loginVerifiedUser(
    {
      id,
      username: claims.preferred_username ? String(claims.preferred_username) : undefined,
      first_name: first || undefined,
      last_name: rest.join(' ') || undefined,
    },
    p.ref,
  );
  if (r.status !== 200) return fail('login');
  return NextResponse.redirect(new URL(p.next, origin));
}
