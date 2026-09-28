// Shrink a picked image to a JPEG data URL in the browser, so uploads stay small (pass "image/png" to keep transparency, e.g. logos)
export function toJpeg(file: File, maxWidth = 1600, quality = 0.82, type: "image/jpeg" | "image/png" = "image/jpeg"): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return reject(new Error("Please choose a JPG, PNG or WebP image."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image is too large. Max 8 MB."));
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL(type, quality));
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = URL.createObjectURL(file);
  });
}
