import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, SUPER_ADMIN_EMAIL } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, locationName, referralCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRefCode = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5) + Math.floor(100 + Math.random() * 900);

    // Look for referrer if referral code was provided
    let referrerUser = null;
    if (referralCode) {
      referrerUser = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
      });
    }

    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        phone: phone || null,
        locationName: locationName || "ঢাকা বিশ্ববিদ্যালয় (DU)",
        referralCode: userRefCode,
        role: isSuperAdmin ? "SUPER_ADMIN" : "USER",
        referredById: referrerUser ? referrerUser.id : null,
      },
    });

    // If referred, log initial pending referral record (points awarded once 1st book is listed!)
    if (referrerUser) {
      await prisma.referralRecord.create({
        data: {
          referrerId: referrerUser.id,
          referredUserId: newUser.id,
          hasListedBook: false,
          pointsAwarded: 0,
        },
      });
    }

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isSuperAdmin,
        points: newUser.points,
        referralCode: newUser.referralCode,
        locationName: newUser.locationName,
      },
    });

    response.cookies.set({
      name: "boibinimoy_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "রেজিস্ট্রেশনে ত্রুটি হয়েছে" }, { status: 500 });
  }
}
