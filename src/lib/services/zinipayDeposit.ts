import { creditZiniPayDeposit, findDepositByTxHash } from '../../db/queries';
import { logger } from '../logger';
import type { ZiniPayInvoice } from './zinipay';

/** Same checks as the bot's processZiniPayPaidInvoice; credit goes through
 * the shared atomic credit_zinipay_deposit RPC (idempotent with the bot). */
export async function processZiniPayPaidInvoice(
  depositId: number,
  invoice: ZiniPayInvoice,
): Promise<{ credited: boolean; amount: number | null; newBalance: number | null }> {
  const none = { credited: false, amount: null, newBalance: null };
  if (invoice.status !== 'COMPLETED') return none;
  const invoiceId = String(invoice.invoice_id);
  const txHash = `zinipay:${invoiceId}`;
  const deposit = await findDepositByTxHash(txHash);
  if (!deposit || deposit.id !== depositId) return none;
  if (deposit.order_intent) return none;
  const expectedInvoiceAmount = Number(deposit.expected_amount ?? deposit.amount);
  if (Math.abs(Number(invoice.amount) - expectedInvoiceAmount) > 0.000001) {
    logger.warn({ depositId, invoiceId, expected: expectedInvoiceAmount, actual: invoice.amount }, 'ZiniPay invoice amount mismatch');
    return none;
  }
  const result = await creditZiniPayDeposit(deposit.id, txHash);
  if (!result.credited) return none;
  return { credited: true, amount: result.amount, newBalance: result.new_balance ?? null };
}
