import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const [
      totalUsers,
      totalBooks,
      availableBooks,
      totalReferrals,
      pendingPayouts,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { isBanned: false } }),
      prisma.book.count(),
      prisma.book.count({ where: { status: "AVAILABLE" } }),
      prisma.referralRecord.count({ where: { hasListedBook: true } }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, locationName: true, points: true, createdAt: true },
      }),
    ]);

    // Area breakdown for books & activity
    const books = await prisma.book.findMany({
      select: { approxLocation: true },
    });

    const areaCounts: Record<string, number> = {};
    books.forEach((b) => {
      const loc = b.approxLocation || "অন্যান্য এলাকা";
      areaCounts[loc] = (areaCounts[loc] || 0) + 1;
    });

    const topAreas = Object.entries(areaCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return NextResponse.json({
      totalUsers,
      totalBooks,
      availableBooks,
      totalReferrals,
      pendingPayouts,
      recentUsers,
      topAreas,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "অ্যানালিটিক্স লোড করা যায়নি" }, { status: 500 });
  }
}
