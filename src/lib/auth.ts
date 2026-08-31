import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "boibinimoy_super_secret_jwt_key_2026";
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@boibinimoy.com";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("boibinimoy_session")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        referralCode: true,
        isBanned: true,
        phone: true,
        image: true,
        latitude: true,
        longitude: true,
        locationName: true,
      },
    });

    if (!user || user.isBanned) return null;

    // Check if user is super admin by email or role
    const isSuperAdmin = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user.role === "SUPER_ADMIN";

    return {
      ...user,
      isSuperAdmin,
    };
  } catch (err) {
    console.error("Error getting current user:", err);
    return null;
  }
}
