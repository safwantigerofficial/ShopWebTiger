import { NextResponse } from 'next/server';
import { env } from '../../../env';
import { getSession } from '../../../lib/session';

// Downloads a Telegram file (e.g. a product's note attachment) through
// the server — clients on blocked networks never touch telegram.org.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session.telegramId) return new NextResponse('login required', { status: 401 });
  const fileId = new URL(req.url).searchParams.get('file') ?? '';
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) return new NextResponse('bad id', { status: 400 });
  const token = env.TELEGRAM_LOGIN_BOT_TOKEN;
  if (!token) return new NextResponse('no token', { status: 500 });
  try {
    const f = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`).then((r) => r.json());
    const path = f?.result?.file_path;
    if (!path) return new NextResponse('not found', { status: 404 });
    const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${path}`);
    if (!fileRes.ok || !fileRes.body) return new NextResponse('not found', { status: 404 });
    const name = new URL(req.url).searchParams.get('name') ?? path.split('/').pop() ?? 'file';
    return new NextResponse(fileRes.body, {
      headers: {
        'content-type': fileRes.headers.get('content-type') ?? 'application/octet-stream',
        'content-disposition': `attachment; filename="${name.replace(/"/g, '')}"`,
      },
    });
  } catch {
    return new NextResponse('error', { status: 500 });
  }
}
