import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    const { id } = await params;
    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            category: true,
            condition: true,
            dealType: true,
            price: true,
            images: true,
            status: true,
            approxLocation: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            image: true,
            locationName: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            locationName: true,
            phone: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "চ্যাটরুম পাওয়া যায়নি" }, { status: 404 });
    }

    // Ensure only the buyer or seller (or Super Admin) can read messages
    if (room.buyerId !== user.id && room.sellerId !== user.id && !user.isSuperAdmin) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 403 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Get room messages error:", error);
    return NextResponse.json({ error: "মেসেজ লোড করা যায়নি" }, { status: 500 });
  }
}
