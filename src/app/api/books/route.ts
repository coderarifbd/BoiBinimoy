import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateDistanceKm, fuzzCoordinates } from "@/lib/geo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const dealType = searchParams.get("dealType");
    const query = searchParams.get("query");
    const userId = searchParams.get("userId");
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lon = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : null;
    const maxDistance = searchParams.get("maxDistance") ? parseFloat(searchParams.get("maxDistance")!) : null;

    const whereClause: Record<string, unknown> = {};

    // For public feed, show AVAILABLE. For user specific inventory, show all except REMOVED
    if (userId) {
      whereClause.userId = userId;
      whereClause.status = { not: "REMOVED" };
    } else {
      whereClause.status = "AVAILABLE";
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (dealType && dealType !== "ALL") {
      whereClause.dealType = dealType;
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { approxLocation: { contains: query, mode: "insensitive" } },
      ];
    }

    let books = await prisma.book.findMany({
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

    // If coordinates & radius filter requested (Distance Slider: 1km, 3km, 5km, 10km)
    if (lat !== null && lon !== null && maxDistance !== null) {
      books = books
        .map((b) => {
          const bookLat = b.latitude || 23.726;
          const bookLon = b.longitude || 90.398;
          const distance = calculateDistanceKm(lat, lon, bookLat, bookLon);
          return { ...b, distance };
        })
        .filter((b) => b.distance <= maxDistance)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (lat !== null && lon !== null) {
      books = books
        .map((b) => {
          const bookLat = b.latitude || 23.726;
          const bookLon = b.longitude || 90.398;
          const distance = calculateDistanceKm(lat, lon, bookLat, bookLon);
          return { ...b, distance };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Fuzz exact coordinates for map pin privacy
    const sanitizedBooks = books.map((b) => {
      const baseLat = b.latitude || 23.726;
      const baseLon = b.longitude || 90.398;
      const fuzzed = fuzzCoordinates(baseLat, baseLon);
      return {
        ...b,
        mapLatitude: fuzzed.lat,
        mapLongitude: fuzzed.lon,
      };
    });

    return NextResponse.json({ books: sanitizedBooks });
  } catch (error) {
    console.error("Fetch books error:", error);
    return NextResponse.json({ error: "বই লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "বই পোস্ট করতে লগইন করুন" }, { status: 401 });
    }

    const {
      title,
      author,
      category,
      condition,
      dealType,
      price,
      images,
      approxLocation,
      latitude,
      longitude,
    } = await req.json();

    if (!title || !category || !condition || !dealType) {
      return NextResponse.json({ error: "প্রয়োজনীয় সকল তথ্য পূরণ করুন" }, { status: 400 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "কমপক্ষে ১টি ছবি আপলোড করুন" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        title,
        author: author || "অজানা লেখক",
        category,
        condition,
        dealType,
        price: dealType === "SELL" ? parseFloat(price) || 0 : 0,
        images: images,
        approxLocation: approxLocation || user.locationName || "ঢাকা",
        latitude: latitude ? parseFloat(latitude) : user.latitude || 23.726,
        longitude: longitude ? parseFloat(longitude) : user.longitude || 90.398,
        userId: user.id,
        status: "AVAILABLE",
      },
    });

    // 🎯 ANTI-FRAUD REFERRAL REWARD CHECK
    // Check if this is the user's first book
    const userBookCount = await prisma.book.count({
      where: { userId: user.id },
    });

    if (userBookCount === 1) {
      // Find if this user was referred by someone
      const pendingReferral = await prisma.referralRecord.findFirst({
        where: {
          referredUserId: user.id,
          hasListedBook: false,
        },
      });

      if (pendingReferral) {
        // Award 100 points to the referrer
        await prisma.referralRecord.update({
          where: { id: pendingReferral.id },
          data: {
            hasListedBook: true,
            pointsAwarded: 100,
          },
        });

        await prisma.user.update({
          where: { id: pendingReferral.referrerId },
          data: {
            points: { increment: 100 },
          },
        });

        console.log(`🎁 Awarded 100 referral points to referrer ID: ${pendingReferral.referrerId}`);
      }
    }

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error("Create book error:", error);
    return NextResponse.json({ error: "বই আপলোড করতে ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
