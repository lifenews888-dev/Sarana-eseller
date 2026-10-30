/**
 * Пилотын бэлтгэл: сүүлийн N хоногийн хүргэлттэй захиалгаас
 *   1) 13-р хороолол (эсвэл --zone=<дугаар>) руу өдөрт хэдэн хүргэлт очдог
 *   2) хаягийн өгөгдлийн чанар (утас, дүүрэг, хаяг дутуу хувь)
 * -г гаргаж, Илгээмжийн CSV импортод шууд оруулах файл бичнэ (хаягийн бүрдэл, эрсдэлийг тэнд "dry run"-аар харна).
 *
 *   npx tsx scripts/ilgeemj-export.ts --days=30 --zone=13 --out=ilgeemj-30d.csv
 *
 * Зөвхөн уншина — өгөгдлийн санд юу ч бичихгүй.
 */
import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { csvRow, inKhoroolol, toIlgeemjOrder } from '../src/lib/ilgeemj';

const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const days = Number(arg('days', '30'));
const zone = Number(arg('zone', '13'));
const out = arg('out', `ilgeemj-${days}d.csv`);

async function main() {
  const prisma = new PrismaClient();
  const since = new Date(Date.now() - days * 86_400_000);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: 'cancelled' }, source: { not: 'pos' } },
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const ubDay = (d: Date) => new Date(d.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);
  const perDay = new Map<string, { all: number; zone: number }>();
  const missing: Record<string, number> = {};
  const lines = [csvRow(['Дугаар', 'Хүлээн авагч', 'Утас', 'Дүүрэг', 'Хаяг', 'Дүн', 'Бараа'])];
  let zoneTotal = 0;
  for (const o of orders) {
    const m = toIlgeemjOrder(o as any);
    const addrText = `${o.deliveryAddress ?? ''} ${o.delivery?.address?.street ?? ''} ${o.delivery?.address?.building ?? ''}`;
    const z = inKhoroolol(addrText, zone);
    const day = ubDay(o.createdAt);
    const c = perDay.get(day) ?? { all: 0, zone: 0 };
    c.all++; if (z) { c.zone++; zoneTotal++; }
    perDay.set(day, c);
    if (!m.ok) { for (const k of m.missing) missing[k] = (missing[k] ?? 0) + 1; continue; }
    const b = m.body;
    lines.push(csvRow([b.externalRef as string, b.customerName as string, b.customerPhone as string, b.district as string, b.address as string, b.codAmount as number, b.item as string]));
  }
  writeFileSync(out, '﻿' + lines.join('\n') + '\n');
  const activeDays = Math.max(1, perDay.size);
  const zonePerDay = zoneTotal / activeDays;
  console.log(`\nСүүлийн ${days} хоног: ${orders.length} захиалга, ${perDay.size} идэвхтэй өдөр`);
  console.log(`${zone}-р хороолол: нийт ${zoneTotal}, өдөрт дунджаар ${zonePerDay.toFixed(1)}`);
  console.log('Өгөгдөл дутуу (CSV-д ороогүй):', Object.keys(missing).length ? missing : 'алга');
  console.log(
    zonePerDay >= 25 ? '→ 14 хоногт 15%-ийн ялгааг илрүүлэх хэмжээний захиалга байна.'
      : zonePerDay >= 9 ? '→ 14 хоногт 25%-ийн ялгааг илрүүлэх боломжтой; 15%-д хугацааг сунгах эсвэл радиусыг томсгоно.'
        : '→ Энэ бүсэд пилотод хангалттай захиалга алга: өөр бүс сонгох эсвэл хэд хэдэн хорооллыг нэгтгэнэ.',
  );
  console.log(`CSV: ${out} (${lines.length - 1} мөр) — Илгээмж → Захиалга → CSV импорт дээр оруулж хаягийн чанарыг харна.\n`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
