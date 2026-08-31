import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, SUPER_ADMIN_EMAIL } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "ইমেইল এবং পাসওয়ার্ড আবশ্যক" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: "ব্যবহারকারী পাওয়া যায়নি" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Banned) করা হয়েছে" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "ভুল পাসওয়ার্ড" }, { status: 401 });
    }

    const isSuperAdmin = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user.role === "SUPER_ADMIN";

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: isSuperAdmin ? "SUPER_ADMIN" : user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: isSuperAdmin ? "SUPER_ADMIN" : user.role,
        isSuperAdmin,
        points: user.points,
        referralCode: user.referralCode,
        locationName: user.locationName,
      },
    });

    response.cookies.set({
      name: "boibinimoy_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে" }, { status: 500 });
  }
}
