import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    // Get referral logs (friends who joined and if they listed 1st book)
    const referralLogs = await prisma.referralRecord.findMany({
      where: { referrerId: user.id },
      include: {
        referredUser: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { books: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count how many listed at least 1 book
    const verifiedReferrals = referralLogs.filter((r) => r.hasListedBook).length;

    // Get user withdrawal history
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      points: user.points,
      referralCode: user.referralCode,
      totalReferred: referralLogs.length,
      verifiedReferrals: verifiedReferrals,
      referralLogs,
      withdrawals,
    });
  } catch (error) {
    console.error("Wallet details error:", error);
    return NextResponse.json({ error: "ওয়ালেট লোড করতে ব্যর্থ হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    const { method, accountNumber } = await req.json();

    if (!method || !accountNumber) {
      return NextResponse.json({ error: "পেমেন্ট মেথড এবং একাউন্ট নম্বর আবশ্যক" }, { status: 400 });
    }

    if (user.points < 1000) {
      return NextResponse.json({
        error: `আপনার পর্যাপ্ত পয়েন্ট নেই। ক্যাশআউট করতে কমপক্ষে ১,০০০ পয়েন্ট প্রয়োজন (আপনার পয়েন্ট: ${user.points})`,
      }, { status: 400 });
    }

    // Deduct 1000 points and create withdrawal request
    const [withdrawal] = await prisma.$transaction([
      prisma.withdrawalRequest.create({
        data: {
          userId: user.id,
          pointsDeducted: 1000,
          amount: 50,
          method: method.toUpperCase(),
          accountNumber: accountNumber.trim(),
          status: "PENDING",
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { points: { decrement: 1000 } },
      }),
    ]);

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ error: "উইথড্র রিকোয়েস্ট করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
