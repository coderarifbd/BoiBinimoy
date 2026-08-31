import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            price: true,
            dealType: true,
            images: true,
            status: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            image: true,
            locationName: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            locationName: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Count unread messages for each room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            roomId: room.id,
            senderId: { not: user.id },
            isRead: false,
          },
        });
        return {
          ...room,
          hasUnread: unreadCount > 0,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ rooms: roomsWithUnread });
  } catch (error) {
    console.error("Fetch chats error:", error);
    return NextResponse.json({ error: "চ্যাট তালিকা লোড করা যায়নি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    const { bookId, sellerId } = await req.json();

    if (!sellerId) {
      return NextResponse.json({ error: "বিক্রেতার তথ্য আবশ্যক" }, { status: 400 });
    }

    if (sellerId === user.id) {
      return NextResponse.json({ error: "আপনি নিজের সাথে চ্যাট করতে পারবেন না" }, { status: 400 });
    }

    // Find existing room or create new
    let room = await prisma.chatRoom.findFirst({
      where: {
        bookId: bookId || null,
        buyerId: user.id,
        sellerId: sellerId,
      },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          bookId: bookId || null,
          buyerId: user.id,
          sellerId: sellerId,
        },
      });
    }

    return NextResponse.json({ success: true, roomId: room.id });
  } catch (error) {
    console.error("Create chat room error:", error);
    return NextResponse.json({ error: "চ্যাট রুম তৈরি করা যায়নি" }, { status: 500 });
  }
}
