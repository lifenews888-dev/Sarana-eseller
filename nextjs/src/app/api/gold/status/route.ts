import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId query param required" }, { status: 400 });

    const membership = await prisma.goldMembership.findUnique({ where: { userId } });

    if (!membership) return NextResponse.json({ membership: null });

    return NextResponse.json({
      membership: {
        ...membership,
        isActive: membership.status !== "CANCELLED" && new Date(membership.endsAt) > new Date(),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
