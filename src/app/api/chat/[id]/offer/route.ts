import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    const { id: roomId } = await params;
    const { messageId, status } = await req.json(); // status: "ACCEPTED" | "DECLINED"

    if (!messageId || !status) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য অনুপস্থিত" }, { status: 400 });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "চ্যাটরুম পাওয়া যায়নি" }, { status: 404 });
    }

    // Only seller or buyer can respond
    if (room.sellerId !== user.id && room.buyerId !== user.id) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 403 });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { offerStatus: status },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Notify via Pusher
    await triggerChatEvent(`chat-${roomId}`, "offer-updated", updatedMessage);

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error("Update offer error:", error);
    return NextResponse.json({ error: "অফার আপডেট করা যায়নি" }, { status: 500 });
  }
}
