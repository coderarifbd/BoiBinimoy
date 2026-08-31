import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const { base64Image, folder } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: "ছবি প্রদান করুন" }, { status: 400 });
    }

    const uploadRes = await uploadToCloudinary(base64Image, folder || "boibinimoy_books");

    if (!uploadRes) {
      // Return base64 as fallback if Cloudinary API is unreachable in local dev
      return NextResponse.json({
        url: base64Image,
        fallback: true,
      });
    }

    return NextResponse.json({
      url: uploadRes.url,
      publicId: uploadRes.publicId,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: "ছবি আপলোড ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
