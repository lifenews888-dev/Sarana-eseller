import { NextRequest, NextResponse } from 'next/server';
import { settleByOrderId } from '@/lib/payment/settle';

/**
 * QPay callback (?orderId=...). Callback-ийн агуулгад итгэхгүй —
 * settleByOrderId нь QPay-ээс өөрөө шалгаж баталгаажуулна.
 */
export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    const r = await settleByOrderId(orderId);
    return NextResponse.json({ status: r.paid ? 'confirmed' : r.status });
  } catch (error) {
    console.error('QPay webhook error:', error);
    // QPay дахин дахин оролдохоос сэргийлж 200 буцаана
    return NextResponse.json({ status: 'error' });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
