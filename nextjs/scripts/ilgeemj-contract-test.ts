/**
 * Илгээмж интеграцийн гэрээний тест (DB-гүй): хаяг/дүүргийн хувиргалт, гарын үсэг, үйл явдлын шилжилт.
 * ILGEEMJ_API_URL + ILGEEMJ_API_KEY өгвөл бодит Илгээмж API руу захиалга үүсгэж, давтан илгээхэд давхардахгүйг шалгана.
 *   npx tsx scripts/ilgeemj-contract-test.ts
 */
import assert from 'node:assert/strict';
import { createHmac } from 'crypto';
import { applyEvent, createDelivery, inKhoroolol, normalizeDistrict, toIlgeemjOrder, verifySignature } from '../src/lib/ilgeemj';

let passed = 0;
const t = async (name: string, fn: () => void | Promise<void>) => { await fn(); passed++; console.log('✓', name); };

async function main() {
  await t('дүүрэг: товчлол, жижиг үсэг, хаяг доторх', () => {
    assert.equal(normalizeDistrict('БЗД'), 'Баянзүрх');
    assert.equal(normalizeDistrict('хан-уул дүүрэг'), 'Хан-Уул');
    assert.equal(normalizeDistrict(null, 'СХД 20-р хороо'), 'Сонгинохайрхан');
    assert.equal(normalizeDistrict('Улаанбаатар'), null);
  });

  await t('захиалга → Илгээмж: COD зөвхөн бэлэн төлбөрт, дутууг нэрлэнэ', () => {
    const base = { id: '65f1a2b3c4d5e6f7a8b9c0d1', orderNumber: 'ES-1024', total: 45000, items: [{ name: 'Гутал', quantity: 2 }], user: { name: 'Сараа' },
      delivery: { phone: '+976 9911 2233', address: { district: 'БЗД', street: '13-р хороолол', building: '24-р байр 48 тоот' } } };
    const cash = toIlgeemjOrder({ ...base, paymentMethod: 'cash' });
    assert.ok(cash.ok);
    if (cash.ok) {
      assert.equal(cash.body.customerPhone, '99112233');
      assert.equal(cash.body.district, 'Баянзүрх');
      assert.equal(cash.body.codAmount, 45000);
      assert.equal(cash.body.item, 'Гутал ×2');
      assert.equal(cash.body.externalRef, 'ES-1024');
    }
    const qpay = toIlgeemjOrder({ ...base, paymentMethod: 'qpay' });
    assert.ok(qpay.ok && qpay.body.codAmount === 0);
    const bad = toIlgeemjOrder({ id: 'x', delivery: { phone: '123', address: {} } });
    assert.deepEqual(!bad.ok && bad.missing, ['утас', 'хаяг', 'дүүрэг']);
  });

  await t('хороолол таних', () => {
    assert.ok(inKhoroolol('13-р хороолол 24-р байр', 13));
    assert.ok(inKhoroolol('БЗД 13 хороолол', 13));
    assert.ok(!inKhoroolol('113-р хороолол', 13));
    assert.ok(!inKhoroolol('3-р хороолол', 13));
  });

  await t('гарын үсэг: зөв, өөрчлөгдсөн бие, хуучирсан', () => {
    const secret = 'whsec_test', body = '{"event":"order.delivered"}';
    const ts = Math.floor(Date.now() / 1000);
    const h = `t=${ts},v1=${createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')}`;
    assert.ok(verifySignature(secret, body, h));
    assert.ok(!verifySignature(secret, body + ' ', h));
    assert.ok(!verifySignature(secret, body, h, Date.now() + 10 * 60_000));
    assert.ok(!verifySignature(secret, body, null));
  });

  await t('үйл явдал: урагш л шилжинэ, давхардлыг алгасна', () => {
    const ev = (event: string, extra = {}) => ({ event, occurredAt: new Date().toISOString(), order: { id: 1, code: '1030-ABCDE', externalRef: 'ES-1', status: 'X', ...extra } });
    const a = applyEvent({ status: 'ready', trackingEvents: [] }, ev('order.picked_up', { etaAt: '2026-11-09T06:30:00Z' }), 'd1');
    assert.ok(!a.duplicate && a.statusChanged === 'delivering' && a.patch.trackingCode === '1030-ABCDE');
    const b = applyEvent({ status: 'delivering', trackingEvents: (a as any).patch.trackingEvents }, ev('order.picked_up'), 'd1');
    assert.ok(b.duplicate);
    const c = applyEvent({ status: 'delivering', trackingEvents: [] }, ev('order.failed', { failReason: 'NO_ANSWER' }), 'd2');
    assert.ok(!c.duplicate && c.statusChanged === null && JSON.stringify(c.patch).includes('утсаа аваагүй'));
    const d = applyEvent({ status: 'delivered', trackingEvents: [] }, ev('order.picked_up'), 'd3');
    assert.ok(!d.duplicate && d.statusChanged === null);
  });

  if (process.env.ILGEEMJ_API_URL && process.env.ILGEEMJ_API_KEY) {
    process.env.ILGEEMJ_ENABLED = '1';
    await t('бодит API: үүсгэх, давтахад ижил хүргэлт', async () => {
      const o = { id: `65f1a2b3c4d5e6f7a8b9${Date.now().toString(16).slice(-4)}`, orderNumber: `ES-T${Date.now()}`, total: 30000, paymentMethod: 'cash', user: { name: 'Тест' },
        delivery: { phone: '99112299', address: { district: 'БЗД', street: '13-р хороолол', building: '24-р байр 48 тоот' } } };
      const a = await createDelivery(o);
      const b = await createDelivery(o);
      assert.equal(a.id, b.id);
      assert.match(a.code, /^\d{4}-[A-Z0-9]{5}$/);
    });
  }
  console.log(`\n${passed} тест амжилттай`);
}

main().catch((e) => { console.error('✗', e); process.exit(1); });
