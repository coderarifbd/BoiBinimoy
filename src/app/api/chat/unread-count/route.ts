import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    // Find all distinct chat rooms where there is at least one unread message sent by the other party
    const unreadMessages = await prisma.chatMessage.findMany({
      where: {
        room: {
          OR: [{ buyerId: user.id }, { sellerId: user.id }],
        },
        senderId: { not: user.id },
        isRead: false,
      },
      select: {
        roomId: true,
      },
      distinct: ["roomId"],
    });

    const unreadCount = unreadMessages.length;

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
