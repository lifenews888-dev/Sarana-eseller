/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
// QPay-ийн хариуг дуурайна: paid[invoiceId] = дүн байвал "PAID" гэж хариулна
export const paid: Record<string, number> = {};
let n = 0;
export function isDemoMode() { return false; }
export function createDemoInvoice(p: { orderId: string }) { return { invoice_id: 'DEMO_' + p.orderId, qr_text: '', qr_image: '', urls: [] }; }
export async function createInvoice(p: { orderId: string; amount: number }) { n += 1; return { invoice_id: `INV${n}`, qr_text: 'qr', qr_image: '', urls: [] }; }
export async function checkPayment(invoiceId: string) {
  const amt = paid[invoiceId];
  return amt ? { count: 1, paid_amount: amt, rows: [{ payment_id: 'P-' + invoiceId, payment_status: 'PAID', payment_date: new Date().toISOString(), payment_amount: amt }] } : { count: 0, paid_amount: 0, rows: [] };
}
export async function cancelInvoice() {}
