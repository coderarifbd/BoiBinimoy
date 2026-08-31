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

    // Find all chat rooms where the user is either buyer or seller
    const unreadCount = await prisma.chatMessage.count({
      where: {
        room: {
          OR: [{ buyerId: user.id }, { sellerId: user.id }],
        },
        senderId: { not: user.id },
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
