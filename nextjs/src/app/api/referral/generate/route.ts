import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    // Аюулгүй байдал: зөвхөн нэвтэрсэн хэрэглэгч өөртөө код үүсгэнэ (өмнө нь биеийн userId-д итгэдэг байв)
    const auth = getAuthUser(req);
    if (!auth) return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    const userId = auth.id;

    // Check for existing active referral code
    const existing = await prisma.referral.findFirst({
      where: { referrerId: userId, status: "pending" },
    });
    if (existing) return NextResponse.json({ code: existing.code });

    // Generate unique code with retry
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const dup = await prisma.referral.findFirst({ where: { code } });
      if (!dup) break;
      code = generateCode();
      attempts++;
    }

    const referral = await prisma.referral.create({
      data: { referrerId: userId, code, status: "pending" },
    });

    return NextResponse.json({ code: referral.code });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
