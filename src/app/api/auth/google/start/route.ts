import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { rand } from '../../../../../lib/oidc';

export const dynamic = 'force-dynamic';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const enabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Google OAuth2 (authorization code). Needs GOOGLE_CLIENT_ID/SECRET on Railway. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  if (!enabled()) return NextResponse.redirect(new URL('/login?err=google_not_configured', origin));
  const session = await getSession();
  const state = rand();
  const nonce = rand();
  const redirectUri = `${origin}/api/auth/google/callback`;
  const next = url.searchParams.get('next') ?? '';
  session.googleOidc = {
    state, verifier: '', nonce, redirectUri, at: Date.now(),
    ref: url.searchParams.get('ref') ?? '',
    next: next.startsWith('/') && !next.startsWith('//') ? next : '/shop',
  };
  await session.save();
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
  });
  return NextResponse.redirect(`${GOOGLE_AUTH}?${q.toString()}`);
}
