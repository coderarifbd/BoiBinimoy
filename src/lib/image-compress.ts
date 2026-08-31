/**
 * Client-side ultra-fast image compression to WebP (<500KB)
 * Scales down high-res photos from mobile camera and converts to clean WebP
 */
export async function compressImageToWebP(
  file: File,
  maxSizeKB: number = 450,
  maxWidthOrHeight: number = 1200
): Promise<{ file: File; dataUrl: string; originalSizeKB: number; compressedSizeKB: number }> {
  const originalSizeKB = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/webp", quality);

        // If still larger than target, decrease quality iteratively
        let attempts = 0;
        while (dataUrl.length * 0.75 > maxSizeKB * 1024 && quality > 0.4 && attempts < 5) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL("image/webp", quality);
          attempts++;
        }

        const compressedSizeKB = Math.round((dataUrl.length * 0.75) / 1024);

        // Convert dataURL to File
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        const compressedFile = new File(
          [u8arr],
          file.name.replace(/\.[^/.]+$/, "") + ".webp",
          { type: mime }
        );

        resolve({
          file: compressedFile,
          dataUrl,
          originalSizeKB,
          compressedSizeKB,
        });
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
