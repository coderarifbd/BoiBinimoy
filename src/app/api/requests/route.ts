import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query");

    const whereClause: Record<string, unknown> = { status: "OPEN" };
    if (category && category !== "ALL") whereClause.category = category;
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { approxLocation: { contains: query, mode: "insensitive" } },
      ];
    }

    const requests = await prisma.bookRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            locationName: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json({ error: "বইয়ের খোঁজ তালিকা লোড করা যায়নি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "রিকোয়েস্ট পোস্ট করতে লগইন করুন" }, { status: 401 });
    }

    const { title, author, category, description, approxLocation } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ error: "বইয়ের নাম ও ক্যাটাগরি আবশ্যক" }, { status: 400 });
    }

    const bookReq = await prisma.bookRequest.create({
      data: {
        title,
        author: author || null,
        category,
        description: description || null,
        approxLocation: approxLocation || user.locationName || "ঢাকা",
        latitude: user.latitude || 23.726,
        longitude: user.longitude || 90.398,
        userId: user.id,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, request: bookReq });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: "রিকোয়েস্ট পোস্ট করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
