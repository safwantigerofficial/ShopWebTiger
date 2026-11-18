import { NextResponse } from 'next/server';
import { findDepositByTxHash } from '../../../../db/queries';
import { verifyZiniPayInvoice } from '../../../../lib/services/zinipay';
import { processZiniPayPaidInvoice } from '../../../../lib/services/zinipayDeposit';
import { logger } from '../../../../lib/logger';

export const dynamic = 'force-dynamic';

// Mirrors the bot's /zinipay/webhook: the payload is never trusted —
// the invoice is re-verified against the ZiniPay API before crediting.
export async function POST(req: Request) {
  const url = new URL(req.url);
  let payload: { invoice_id?: string | number } = {};
  try {
    const text = await req.text();
    if (text.length > 256 * 1024) return new NextResponse(null, { status: 413 });
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }
  const invoiceId = String(payload.invoice_id ?? url.searchParams.get('invoice_id') ?? '');
  if (!invoiceId) return new NextResponse(null, { status: 400 });
  try {
    const verified = await verifyZiniPayInvoice(invoiceId);
    if (verified.ok && verified.invoice.status === 'COMPLETED') {
      const deposit = await findDepositByTxHash(`zinipay:${invoiceId}`);
      if (deposit) await processZiniPayPaidInvoice(deposit.id, verified.invoice);
    }
  } catch (err) {
    logger.warn({ err, invoiceId }, 'ZiniPay webhook processing failed');
  }
  return NextResponse.json({ ok: true });
}
