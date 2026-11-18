import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { OIDC_AUTH, oidcClientId, oidcEnabled, rand, s256 } from '../../../../../lib/oidc';

export const dynamic = 'force-dynamic';

// Telegram OpenID Connect (Authorization Code + PKCE). quick_auth=new shows
// Telegram's "Login options" page → in-app "Log in to <site>" confirm popup.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  if (!oidcEnabled()) return NextResponse.redirect(new URL('/login?err=oidc_not_configured', origin));
  const session = await getSession();
  const state = rand();
  const verifier = rand(48);
  const nonce = rand();
  const redirectUri = `${origin}/api/auth/oidc/callback`;
  const next = url.searchParams.get('next') ?? '';
  session.oidc = {
    state, verifier, nonce, redirectUri, at: Date.now(),
    ref: url.searchParams.get('ref') ?? '',
    next: next.startsWith('/') && !next.startsWith('//') ? next : '/shop',
  };
  await session.save();
  const q = new URLSearchParams({
    client_id: oidcClientId(),
    origin,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile',
    state,
    nonce,
    code_challenge: s256(verifier),
    code_challenge_method: 'S256',
    quick_auth: 'new',
  });
  return NextResponse.redirect(`${OIDC_AUTH}?${q.toString()}`);
}
