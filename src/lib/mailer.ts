import { env } from '../env';
import { logger } from './logger';

/**
 * Minimal outbound email via the Resend HTTPS API — same transport
 * the bot prefers (Railway blocks raw SMTP ports). Fire-and-forget:
 * failures are logged, never thrown. No-op when RESEND_API_KEY is
 * not configured.
 */

const FROM = () => `${process.env.RESEND_FROM_NAME ?? 'SafwanTiger Shop'} <${process.env.RESEND_FROM ?? 'shopbot@safwantiger.com'}>`;

export async function sendEmail(args: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY ?? '';
  if (!key) {
    logger.warn({ to: args.to }, 'mailer: RESEND_API_KEY missing — email skipped');
    return false;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: FROM(), to: [args.to], subject: args.subject, html: args.html }),
    });
    if (!r.ok) {
      logger.warn({ status: r.status, body: (await r.text()).slice(0, 300), to: args.to }, 'mailer: resend rejected');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, to: args.to }, 'mailer: send failed');
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shell(title: string, body: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;background:#0b1220;color:#e2e8f0;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#16a36a,#0ea5e9);padding:24px 28px">
    <div style="font-size:20px;font-weight:800;color:#fff">SafwanTiger Shop</div>
  </div>
  <div style="padding:24px 28px">
    <h2 style="margin:0 0 12px;font-size:17px;color:#fff">${title}</h2>
    <div style="font-size:14px;line-height:1.7;color:#cbd5e1">${body}</div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #1e293b;font-size:12px;color:#64748b">
    You received this because your email is saved on SafwanTiger Shop.
  </div>
</div>`;
}

/** Sent when a user saves or changes their email on the website. */
export async function sendWelcomeEmail(args: { to: string; name: string }): Promise<boolean> {
  return sendEmail({
    to: args.to,
    subject: 'Your email is connected to SafwanTiger Shop',
    html: shell('Email saved', `Hi ${escapeHtml(args.name)},<br><br>Your email address <b>${escapeHtml(args.to)}</b> is now linked to your SafwanTiger Shop account. You'll get order invoices and reports here.<br><br>If this wasn't you, just reply to this email.`),
  });
}

/** Order invoice / delivery confirmation, mirroring the bot's invoice email. */
export async function sendInvoiceEmail(args: { to: string; name: string; orderId: string; product: string; qty: number; total: number; items?: string[] }): Promise<boolean> {
  const items = args.items?.length
    ? `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:12px 14px;font-family:monospace;font-size:12px;white-space:pre-wrap;margin-top:12px">${args.items.map(escapeHtml).join('<br>')}</div>`
    : '';
  return sendEmail({
    to: args.to,
    subject: `Order ${args.orderId} — SafwanTiger Shop`,
    html: shell('Order confirmed', `Hi ${escapeHtml(args.name)},<br><br>Your order <b>${escapeHtml(args.orderId)}</b> is complete:<br><br>• Product: <b>${escapeHtml(args.product)}</b><br>• Qty: ${args.qty}<br>• Total: <b>$${args.total.toFixed(2)}</b>${items}<br><br>Your delivery is also available in <b>My orders</b> on the website.`),
  });
}
