import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            books: true,
            referralsMade: true,
            withdrawals: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "ইউজার তালিকা লোড করা যায়নি" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const { targetUserId, isBanned } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "ইউজার আইডি আবশ্যক" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: Boolean(isBanned) },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json({ error: "ইউজার স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
