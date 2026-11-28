/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
// Мөнгөний урсгалын end-to-end тест: QPay төлбөр → дундын данс → хүргэлт → баталгаажуулалт/буцаалт/cron,
// оноо, купон, зэрэг мөнгө гаргалт. Жинхэнэ route-уудыг санах ойн Prisma, хуурамч QPay-тэй ажиллуулна.
// Ажиллуулах: cd nextjs && npm run test:money
import { NextRequest } from 'next/server';
import { db } from './fakes/prisma';
import { paid } from './fakes/qpay';
import { signToken } from '@/lib/api-auth';
import { POST as createInvoice } from '../../src/app/api/checkout/create-invoice/route';
import { GET as qpayCheck } from '../../src/app/api/payment/qpay/check/[invoiceId]/route';
import { PATCH as sellerStatus } from '../../src/app/api/seller/orders/[id]/status/route';
import { POST as driverAccept } from '../../src/app/api/driver/orders/[id]/accept/route';
import { POST as driverDeliver } from '../../src/app/api/driver/orders/[id]/deliver/route';
import { POST as buyerConfirm } from '../../src/app/api/orders/[id]/confirm/route';
import { POST as escrowConfirm } from '../../src/app/api/escrow/confirm/route';
import { POST as requestReturn } from '../../src/app/api/orders/[id]/return/route';
import { PUT as adminReturn } from '../../src/app/api/admin/returns/[id]/route';
import { GET as cronRelease } from '../../src/app/api/cron/escrow-release/route';
import { POST as payout } from '../../src/app/api/wallet/payout/route';
import { GET as buyerOrder } from '../../src/app/api/buyer/orders/[id]/route';

process.env.JWT_SECRET = 'test-secret';
let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); };
const id = () => require('crypto').randomBytes(12).toString('hex');
const row = (m: string, w: (r: any) => boolean) => (db[m] || []).find(w);

const users: Record<string, any> = {};
function mkUser(key: string, role: string) { const u = { id: id(), email: key + '@t.mn', name: key, role, createdAt: new Date() }; (db.user ||= []).push(u); users[key] = { ...u, token: signToken({ id: u.id, role }) }; }
mkUser('buyer', 'buyer'); mkUser('seller', 'seller'); mkUser('seller2', 'seller'); mkUser('driver', 'delivery'); mkUser('admin', 'admin'); mkUser('stranger', 'buyer');
const shop = { id: id(), userId: users.seller.id, name: 'Дэлгүүр 1', createdAt: new Date() };
const shop2 = { id: id(), userId: users.seller2.id, name: 'Дэлгүүр 2', createdAt: new Date() };
db.shop = [shop, shop2];
const prod = (shopId: string, ownerId: string, price: number) => ({ id: id(), shopId, userId: ownerId, name: 'Бараа ' + price, price, salePrice: null, stock: 100, isActive: true, status: 'active', images: [], createdAt: new Date() });
const p1 = prod(shop.id, users.seller.id, 60000), p2 = prod(shop2.id, users.seller2.id, 10000);
db.product = [p1, p2];
db.loyaltyAccount = [{ id: id(), userId: users.buyer.id, balance: 1000, lifetimeEarned: 1000, lifetimeSpent: 0, tier: 'BRONZE', createdAt: new Date() }];
db.coupon = [{ id: id(), code: 'SALE10', isActive: true, discountType: 'PERCENT', discountValue: 10, usageLimit: 1, usageCount: 0, createdAt: new Date() }];

async function call(fn: any, method: string, url: string, who: string | null, body?: any, params?: any) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (who && who !== 'CRON') headers.authorization = `Bearer ${users[who].token}`;
  if (who === 'CRON') headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
  const req = new NextRequest('https://eseller.mn' + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const res: Response = await fn(req, { params: Promise.resolve(params || {}) });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, j };
}
const wallet = (k: string) => row('wallet', (w) => w.userId === users[k].id) || { balance: 0, pending: 0 };
const pts = () => row('loyaltyAccount', (a) => a.userId === users.buyer.id).balance;
const order = (oid: string) => row('order', (o) => o.id === oid);
const escrow = (oid: string) => row('escrowTransaction', (e) => e.orderId === oid);

async function buyAndPay(items: any[], extra: any = {}) {
  const r = await call(createInvoice, 'POST', '/api/checkout/create-invoice', 'buyer', { items, deliveryAddress: 'УБ', phone: '99112233', ...extra });
  if (r.status !== 200) return { r };
  paid[r.j.invoiceId] = r.j.amount;
  const c = await call(qpayCheck, 'GET', `/api/payment/qpay/check/${r.j.invoiceId}`, null, null, { invoiceId: r.j.invoiceId });
  return { r, c, orderId: r.j.orderId as string, amount: r.j.amount as number, invoiceId: r.j.invoiceId };
}
async function shipAndDeliver(oid: string) {
  for (const s of ['preparing', 'ready']) await call(sellerStatus, 'PATCH', `/api/seller/orders/${oid}/status`, 'seller', { status: s }, { id: oid });
  await call(driverAccept, 'POST', `/api/driver/orders/${oid}/accept`, 'driver', null, { id: oid });
  return call(driverDeliver, 'POST', `/api/driver/orders/${oid}/deliver`, 'driver', null, { id: oid });
}

(async () => {
  console.log('\n— 1. Олон дэлгүүрийн сагс');
  const multi = await call(createInvoice, 'POST', '/api/checkout/create-invoice', 'buyer', { items: [{ productId: p1.id, qty: 1 }, { productId: p2.id, qty: 1 }], deliveryAddress: 'УБ', phone: '99112233' });
  check('Хоёр дэлгүүрийн бараа нэг захиалга болохгүй', multi.status === 400, multi.j.error);

  console.log('\n— 2. Оноо + купон, үнэ серверт тооцогдох');
  const A = await buyAndPay([{ productId: p1.id, qty: 1, price: 1 }], { couponCode: 'SALE10', loyaltyPoints: 5000, totalAmount: 1 });
  // 60000 − 10% (6000) − оноо: үлдэгдэл 1000 оноо × 5₮ = 5000 → 49000
  check('Клиентийн үнэ (1₮) үл тоогдож, дүн 49,000₮', A.amount === 49000, `${A.amount}₮`);
  check('Оноо үлдэгдлээр хязгаарлагдсан (5000 хүссэн → 1000)', order(A.orderId).loyaltyPointsUsed === 1000, String(order(A.orderId).loyaltyPointsUsed));
  check('Захиалга зөв дэлгүүрт оногдсон', order(A.orderId).shopId === shop.id);

  console.log('\n— 3. Төлбөр баталгаажих → дундын данс');
  check('Захиалга confirmed болсон', order(A.orderId).status === 'confirmed');
  check('Escrow HOLDING, дүн 49,000₮', escrow(A.orderId)?.status === 'HOLDING' && escrow(A.orderId)?.amount === 49000);
  check('Дэлгүүрийн хүлээгдэж буй 48,020₮ (2% шимтгэл хассан), үлдэгдэл 0', wallet('seller').pending === 48020 && wallet('seller').balance === 0, `pending ${wallet('seller').pending}, balance ${wallet('seller').balance}`);
  check('Худалдан авагчийн оноо 1000 → 0', pts() === 0, String(pts()));
  check('Купоны хэрэглээ 1 болсон', db.coupon[0].usageCount === 1);
  await call(qpayCheck, 'GET', `/api/payment/qpay/check/${A.invoiceId}`, null, null, { invoiceId: A.invoiceId });
  await call(qpayCheck, 'GET', `/api/payment/qpay/check/${A.invoiceId}`, null, null, { invoiceId: A.invoiceId });
  check('Төлбөрийг дахин шалгахад давхардахгүй', wallet('seller').pending === 48020 && db.coupon[0].usageCount === 1 && pts() === 0 && db.escrowTransaction.length === 1);

  console.log('\n— 4. Купоны хязгаар');
  const again = await call(createInvoice, 'POST', '/api/checkout/create-invoice', 'buyer', { items: [{ productId: p1.id, qty: 1 }], couponCode: 'SALE10', deliveryAddress: 'УБ', phone: '99112233' });
  check('1 удаагийн купон дахин хэрэглэгдэхгүй', again.status === 400, again.j.error);

  console.log('\n— 5. Хүргэлт');
  const strangerAccept = await call(driverAccept, 'POST', `/api/driver/orders/${A.orderId}/accept`, 'stranger', null, { id: A.orderId });
  check('Жолооч биш хүн захиалга авч чадахгүй', strangerAccept.status === 403);
  const del = await shipAndDeliver(A.orderId);
  check('Жолооч хүргэсэн', del.status === 200 && order(A.orderId).status === 'delivered');
  const hrs = (escrow(A.orderId).autoReleaseAt.getTime() - Date.now()) / 3600000;
  check('72 цагийн хугацаа эхэлсэн', hrs > 71.9 && hrs <= 72, hrs.toFixed(2) + 'ц');
  check('Хүргэсэн даруйд дэлгүүрт мөнгө ороогүй', wallet('seller').balance === 0);
  const view = await call(buyerOrder, 'GET', `/api/buyer/orders/${A.orderId}`, 'buyer', null, { id: A.orderId });
  check('Апп "Хүлээн авсан" товч харуулна', view.j.data?.order?.canConfirmReceipt === true && view.j.data?.order?.escrow?.status === 'HOLDING');

  console.log('\n— 6. Худалдан авагч баталгаажуулах');
  const sc = await call(buyerConfirm, 'POST', `/api/orders/${A.orderId}/confirm`, 'stranger', null, { id: A.orderId });
  check('Өөр хүн баталгаажуулж чадахгүй', sc.status === 403);
  const se = await call(escrowConfirm, 'POST', '/api/escrow/confirm', 'stranger', { orderId: A.orderId });
  check('Өөр хүн escrow/confirm хийж чадахгүй', se.status === 404);
  const bc = await call(buyerConfirm, 'POST', `/api/orders/${A.orderId}/confirm`, 'buyer', null, { id: A.orderId });
  check('Баталгаажуулсан → дэлгүүрт 48,020₮ шилжсэн, хүлээгдэж буй 0', bc.status === 200 && wallet('seller').balance === 48020 && wallet('seller').pending === 0, `balance ${wallet('seller').balance}, pending ${wallet('seller').pending}`);
  await call(buyerConfirm, 'POST', `/api/orders/${A.orderId}/confirm`, 'buyer', null, { id: A.orderId });
  await call(escrowConfirm, 'POST', '/api/escrow/confirm', 'buyer', { orderId: A.orderId });
  check('Дахин дарахад давхар орохгүй', wallet('seller').balance === 48020);
  const late = await call(requestReturn, 'POST', `/api/orders/${A.orderId}/return`, 'buyer', { reason: 'Бусад' }, { id: A.orderId });
  check('Мөнгө шилжсэний дараа буцаалт хүсэх боломжгүй', late.status === 400, late.j.error);

  console.log('\n— 7. Буцаалт зөвшөөрөгдөх');
  const B = await buyAndPay([{ productId: p1.id, qty: 1 }]);
  check('2-р захиалга: 60,000₮, хүлээгдэж буй 58,800₮', B.amount === 60000 && wallet('seller').pending === 58800);
  await shipAndDeliver(B.orderId);
  const ret = await call(requestReturn, 'POST', `/api/orders/${B.orderId}/return`, 'buyer', { reason: 'Бараа эвдэрсэн' }, { id: B.orderId });
  check('Буцаалт хүссэн → DISPUTED', ret.status === 200 && escrow(B.orderId).status === 'DISPUTED');
  escrow(B.orderId).autoReleaseAt = new Date(Date.now() - 1000);
  process.env.CRON_SECRET = 'cron-s';
  await call(cronRelease, 'GET', '/api/cron/escrow-release', 'CRON');
  check('Маргаантай үед 72ц өнгөрсөн ч автоматаар шилжихгүй', escrow(B.orderId).status === 'DISPUTED' && wallet('seller').balance === 48020);
  const rr = row('returnRequest', (x) => x.orderId === B.orderId);
  const ap = await call(adminReturn, 'PUT', `/api/admin/returns/${rr.id}`, 'admin', { status: 'APPROVED' }, { id: rr.id });
  check('Админ зөвшөөрөв → худалдан авагчид 60,000₮ буцсан', ap.status === 200 && wallet('buyer').balance === 60000, `buyer ${wallet('buyer').balance}`);
  check('Дэлгүүрийн хүлээгдэж буй 0 болж, үлдэгдэл өөрчлөгдөөгүй', wallet('seller').pending === 0 && wallet('seller').balance === 48020);
  check('Захиалга цуцлагдсан, escrow REFUNDED', order(B.orderId).status === 'cancelled' && escrow(B.orderId).status === 'REFUNDED');

  console.log('\n— 8. Дэлгүүр төлөгдсөн захиалгыг цуцлах (оноо буцах)');
  db.loyaltyAccount[0].balance = 500;
  const C = await buyAndPay([{ productId: p1.id, qty: 1 }], { loyaltyPoints: 500 });
  check('500 оноо хасагдсан, дүн 57,500₮', pts() === 0 && C.amount === 57500, `${C.amount}₮, оноо ${pts()}`);
  const cancel = await call(sellerStatus, 'PATCH', `/api/seller/orders/${C.orderId}/status`, 'seller', { status: 'cancelled' }, { id: C.orderId });
  check('Цуцлав → худалдан авагчид +57,500₮', cancel.status === 200 && wallet('buyer').balance === 117500, `buyer ${wallet('buyer').balance}`);
  check('Оноо 500 буцаж орсон', pts() === 500, String(pts()));
  check('Дэлгүүрийн хүлээгдэж буй 0', wallet('seller').pending === 0);

  console.log('\n— 9. 72 цагийн автомат шилжүүлэг');
  const D = await buyAndPay([{ productId: p1.id, qty: 1 }]);
  await shipAndDeliver(D.orderId);
  delete process.env.CRON_SECRET;
  const noSecret = await cronRelease(new NextRequest('https://eseller.mn/api/cron/escrow-release', { headers: { authorization: 'Bearer undefined' } }));
  check('CRON_SECRET байхгүй үед "Bearer undefined" татгалзана', noSecret.status === 401);
  process.env.CRON_SECRET = 'cron-s';
  await call(cronRelease, 'GET', '/api/cron/escrow-release', 'CRON');
  check('72ц болоогүй бол шилжихгүй', escrow(D.orderId).status === 'HOLDING');
  escrow(D.orderId).autoReleaseAt = new Date(Date.now() - 1000);
  const cr = await call(cronRelease, 'GET', '/api/cron/escrow-release', 'CRON');
  check('72ц өнгөрсөн → дэлгүүрт 58,800₮', cr.j.released === 1 && wallet('seller').balance === 48020 + 58800, `balance ${wallet('seller').balance}`);
  await call(cronRelease, 'GET', '/api/cron/escrow-release', 'CRON');
  check('Cron дахин ажиллахад давхардахгүй', wallet('seller').balance === 106820);

  console.log('\n— 10. Зэрэг мөнгө гаргах');
  const before = wallet('seller').balance; // 106,820
  const rs = await Promise.all(Array.from({ length: 8 }, () => call(payout, 'POST', '/api/wallet/payout', 'seller', { amount: 30000, bankName: 'Хаан', bankAccount: '5000' })));
  const okN = rs.filter((r) => r.status === 200).length;
  check('8 зэрэг хүсэлтээс зөвхөн 3 нь амжилттай (106,820₮ ÷ 30,000)', okN === 3 && wallet('seller').balance === before - 90000 && wallet('seller').balance >= 0, `${okN} амжилттай, үлдэгдэл ${wallet('seller').balance}`);

  console.log(`\nНийт: ${pass} амжилттай, ${fail} алдаатай`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });
