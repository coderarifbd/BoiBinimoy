import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "m4tmnzzs",
  api_key: process.env.CLOUDINARY_API_KEY || "823791333792942",
  api_secret: process.env.CLOUDINARY_API_SECRET || "-btnpS0X6AvewrW7Lnn1EoYPbw4",
  secure: true,
});

export async function uploadToCloudinary(
  base64OrBuffer: string,
  folder: string = "boibinimoy_books"
): Promise<{ url: string; publicId: string } | null> {
  try {
    const result = await cloudinary.uploader.upload(base64OrBuffer, {
      folder: folder,
      resource_type: "image",
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "webp" },
        { width: 1000, crop: "limit" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

export default cloudinary;
