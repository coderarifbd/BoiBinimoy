import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক" }, { status: 401 });
    }

    const { id: roomId } = await params;
    const { content, image, isOffer, offerAmount, meetupSpot } = await req.json();

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "চ্যাটরুম পাওয়া যায়নি" }, { status: 404 });
    }

    if (room.buyerId !== user.id && room.sellerId !== user.id) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 403 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: user.id,
        content: content || (isOffer ? `একটি অফার পাঠানো হয়েছে: ৳${offerAmount}` : meetupSpot ? `মিটআপ স্পট প্রস্তাব করা হয়েছে: ${meetupSpot}` : "ছবি পাঠানো হয়েছে"),
        image: image || null,
        isOffer: Boolean(isOffer),
        offerAmount: offerAmount ? parseFloat(offerAmount) : null,
        offerStatus: isOffer ? "PENDING" : null,
        meetupSpot: meetupSpot || null,
      },
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

    // Update room updatedAt
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Trigger Pusher real-time event
    await triggerChatEvent(`chat-${roomId}`, "new-message", message);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "মেসেজ পাঠানো ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
