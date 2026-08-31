import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const books = await prisma.book.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isBanned: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Moderation list error:", error);
    return NextResponse.json({ error: "বইয়ের তালিকা লোড করা যায়নি" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "সুপার অ্যাডমিন এক্সেস প্রয়োজন" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "বুক আইডি আবশ্যক" }, { status: 400 });
    }

    await prisma.book.delete({
      where: { id: bookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete book error:", error);
    return NextResponse.json({ error: "বই মুছে ফেলা সম্ভব হয়নি" }, { status: 500 });
  }
}
