# Илгээмж Төв — хүргэлтийн интеграц

Дэлгүүр захиалгаа **"Бэлэн" (ready)** болгоход eseller автоматаар Илгээмж рүү хүргэлт үүсгэнэ. Илгээмж хаягийг шалгаж,
хүлээн авагчид 4 оронтой PIN ба хяналтын холбоос SMS-ээр явуулна. Жолооч замд гарахад eseller-ийн захиалга **"delivering"**,
хүлээн авагчийн PIN-ээр хүлээлгэн өгөхөд **"delivered"** болно.

## Тохиргоо (.env)

```
ILGEEMJ_ENABLED=1
ILGEEMJ_API_URL=https://api.ilgeemj.mn          # Илгээмжийн API
ILGEEMJ_API_KEY=mk_...                           # Илгээмж → Интеграц → API түлхүүр
ILGEEMJ_WEBHOOK_SECRET=whsec_...                 # Илгээмж → Интеграц → Webhook нэмэхэд нэг удаа харагдана
ILGEEMJ_WEB_URL=https://ilgeemj.mn               # хүлээн авагчийн хяналтын холбоос (/r/<token>)
```

Илгээмж дээр webhook бүртгэх URL: `https://eseller.mn/api/webhooks/ilgeemj`, үйл явдал: бүгд (`*`). "Туршиж илгээх" товчоор шалгана.

## Юу хийдэг вэ

| Хэсэг | Файл |
| --- | --- |
| Захиалгыг Илгээмжийн форматад хувиргах, дүүргийн товчлол (БЗД…), COD зөвхөн бэлэн төлбөрт | `nextjs/src/lib/ilgeemj.ts` |
| "ready" болоход хүргэлт үүсгэх (Idempotency-Key = `eseller-<id>`, 3 удаа давтана; алдааг `trackingEvents`-д бичнэ) | `nextjs/src/app/api/orders/[id]/status/route.ts` |
| Webhook хүлээн авах: HMAC `t=,v1=` гарын үсэг, 5 минутын цонх, давхардсан илгээлтийг алгасна, төлөв зөвхөн урагш | `nextjs/src/app/api/webhooks/ilgeemj/route.ts` |
| Пилотын бэлтгэл: бүсийн өдрийн хүргэлтийн тоо, өгөгдлийн чанар, Илгээмжийн CSV | `nextjs/scripts/ilgeemj-export.ts` |
| Тест | `npm run test:ilgeemj` (ILGEEMJ_API_URL/KEY өгвөл бодит API-тай) |

## Пилотын өмнө

```
cd nextjs
npm run ilgeemj:export -- --days=30 --zone=13 --out=ilgeemj-30d.csv
```

13-р хороололд өдөрт хэдэн хүргэлт очдог, хэдэн захиалгад утас/дүүрэг/хаяг дутуу байгааг хэвлэнэ. CSV-г Илгээмж → Захиалга →
CSV импорт дээр оруулж (урьдчилан харах горим) хаягийн бүрдэл, эрсдэлийг харна.
