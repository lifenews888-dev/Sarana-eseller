import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

// GET /api/wallet — get wallet balance
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 0, pending: 0 } });
  }

  return json({ balance: wallet.balance, pending: wallet.pending, history: wallet.history || [] });
}

// POST /api/wallet — request payout
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { amount, bank, account } = await req.json().catch(() => ({}));
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 10000) return errorJson('Хамгийн бага 10,000₮ гаргана', 400);
  if (typeof bank !== 'string' || !bank.trim() || typeof account !== 'string' || !account.trim()) {
    return errorJson('Банк болон дансны дугаар шаардлагатай', 400);
  }

  const debited = await prisma.wallet.updateMany({
    where: { userId: user.id, balance: { gte: amount } },
    data: {
      balance: { decrement: amount },
      history: {
        push: { type: 'PAYOUT', amount: -amount, description: `${bank} ${account} руу шилжүүлэг`, status: 'PENDING', createdAt: new Date().toISOString() },
      },
    },
  });
  if (debited.count === 0) return errorJson('Үлдэгдэл хүрэлцэхгүй', 400);

  return json({ message: 'Гаргалгааны хүсэлт илгээгдлээ. 24 цагийн дотор шилжүүлнэ.' });
}
