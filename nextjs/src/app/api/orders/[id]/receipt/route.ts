import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createReceipt, calculateTax } from '@/lib/ebarimt';
import { ok, fail } from '@/lib/api-envelope';

type ReceiptLine = {
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
};

type ReceiptOrderExtras = {
  buyerTIN?: string | null;
};

function jsonRecord(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Prisma.JsonValue>
    : null;
}

function jsonString(value: Prisma.JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function jsonNumber(value: Prisma.JsonValue | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function receiptLineFromOrderItem(item: Prisma.JsonValue): ReceiptLine {
  const record = jsonRecord(item);
  const name = jsonString(record?.name) || jsonString(record?.title) || 'Бараа';
  const qty = jsonNumber(record?.qty ?? record?.quantity, 1);
  const unitPrice = jsonNumber(record?.price, 0);

  return {
    name,
    qty,
    unitPrice,
    totalPrice: unitPrice * qty,
  };
}

function receiptLinesToJson(items: ReceiptLine[]): Prisma.InputJsonArray {
  return items.map((item) => ({
    name: item.name,
    qty: item.qty,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Check for existing receipt
    const existing = await prisma.taxReceipt.findFirst({
      where: { orderId },
    });

    if (existing) {
      return ok(existing);
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return fail('Захиалга олдсонгүй', 404);
    }

    // Build items from order
    const orderData = order as typeof order & ReceiptOrderExtras;
    const items: ReceiptLine[] = order.items.map(receiptLineFromOrderItem);

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0) || order.total || 0;

    // If no items, create a single-line receipt
    if (items.length === 0) {
      items.push({
        name: 'Захиалга',
        qty: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount,
      });
    }

    // Create еБаримт receipt
    const receipt = await createReceipt(orderId, orderData.buyerTIN || null, items);
    const tax = calculateTax(totalAmount);
    const receiptItemsJson = receiptLinesToJson(items);

    // Save to DB
    const saved = await prisma.taxReceipt.create({
      data: {
        orderId,
        billId: receipt.billId,
        qrData: receipt.qrData,
        lottery: receipt.lottery,
        amount: totalAmount,
        vatAmount: tax.vat,
        cityTax: tax.cityTax,
        buyerTIN: receipt.buyerTIN,
        items: receiptItemsJson,
        status: 'SUCCESS',
      },
    });

    return ok(saved);
  } catch (error: unknown) {
    console.error('еБаримт алдаа:', error);
    return fail('Баримт үүсгэхэд алдаа гарлаа', 500);
  }
}
