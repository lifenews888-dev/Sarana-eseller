import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Аюулгүй байдал: userId-г body-оос биш, нэвтэрсэн хэрэглэгчийн токеноос авна
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;
    const userId = authUser.id;

    const membership = await prisma.goldMembership.findUnique({ where: { userId } });
    if (!membership) {
      return NextResponse.json({ error: "No membership found" }, { status: 404 });
    }

    const updated = await prisma.goldMembership.update({
      where: { userId },
      data: { status: "CANCELLED", autoRenew: false },
    });

    return NextResponse.json({
      membership: updated,
      message: `Access continues until ${updated.endsAt.toISOString()}`,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
