import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Аюулгүй байдал: userId-г body-оос биш, нэвтэрсэн хэрэглэгчийн токеноос авна
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;
    const { code } = await req.json();
    const userId = authUser.id;
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const referral = await prisma.referral.findFirst({ where: { code, status: "pending" } });
    if (!referral) {
      return NextResponse.json({ error: "Invalid or already used referral code" }, { status: 400 });
    }
    if (referral.referrerId === userId) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    await prisma.referral.update({
      where: { id: referral.id },
      data: { referredId: userId, status: "completed" },
    });

    return NextResponse.json({ success: true, referrerId: referral.referrerId });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
