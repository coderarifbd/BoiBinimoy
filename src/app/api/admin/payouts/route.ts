import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const payouts = await prisma.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            points: true,
            locationName: true,
            referralLogs: {
              include: {
                referredUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    _count: { select: { books: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("Fetch payouts error:", error);
    return NextResponse.json({ error: "পেআউট তালিকা লোড করা যায়নি" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const { payoutId, status, adminNote } = await req.json();

    if (!payoutId || !status) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য অনুপস্থিত" }, { status: 400 });
    }

    const existing = await prisma.withdrawalRequest.findUnique({
      where: { id: payoutId },
    });

    if (!existing) {
      return NextResponse.json({ error: "পেআউট রিকোয়েস্ট পাওয়া যায়নি" }, { status: 404 });
    }

    // If rejected, refund the 1000 points back to the user
    if (status === "REJECTED" && existing.status === "PENDING") {
      await prisma.$transaction([
        prisma.withdrawalRequest.update({
          where: { id: payoutId },
          data: { status: "REJECTED", adminNote: adminNote || "জালিয়াতি বা অপর্যাপ্ত শর্তের কারণে বাতিল" },
        }),
        prisma.user.update({
          where: { id: existing.userId },
          data: { points: { increment: existing.pointsDeducted } },
        }),
      ]);
    } else {
      await prisma.withdrawalRequest.update({
        where: { id: payoutId },
        data: {
          status: status, // APPROVED
          adminNote: adminNote || "টাকা সফলভাবে পাঠানো হয়েছে",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update payout error:", error);
    return NextResponse.json({ error: "পেআউট আপডেট করা যায়নি" }, { status: 500 });
  }
}
