import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            locationName: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "বই পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Get book error:", error);
    return NextResponse.json({ error: "বইয়ের তথ্য লোড করা যায়নি" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "বই পাওয়া যায়নি" }, { status: 404 });
    }

    if (existing.userId !== user.id && !user.isSuperAdmin) {
      return NextResponse.json({ error: "আপনার এই অনুমতি নেই" }, { status: 403 });
    }

    const updated = await prisma.book.update({
      where: { id },
      data: { status: status || (existing.status === "AVAILABLE" ? "SOLD" : "AVAILABLE") },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error) {
    console.error("Update book error:", error);
    return NextResponse.json({ error: "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "বই পাওয়া যায়নি" }, { status: 404 });
    }

    if (existing.userId !== user.id && !user.isSuperAdmin) {
      return NextResponse.json({ error: "আপনার এই অনুমতি নেই" }, { status: 403 });
    }

    await prisma.book.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete book error:", error);
    return NextResponse.json({ error: "বই মুছে ফেলা যায়নি" }, { status: 500 });
  }
}
