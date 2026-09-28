// Validate an uploaded proof/attachment before storing it in the database
import "server-only";

export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const UPLOAD_MAX_MB = 5;

// the browser's declared type can be faked, so check the file's first bytes too
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  "application/pdf": (b) => String.fromCharCode(...b.slice(0, 5)) === "%PDF-",
};

export async function readUpload(value: FormDataEntryValue | null, { required = true } = {}) {
  if (!(value instanceof File) || value.size === 0) return required ? { error: "Please attach your file." } : { file: null };
  if (!UPLOAD_TYPES.includes(value.type)) return { error: "Please upload a JPG, PNG, WebP or PDF file." };
  if (value.size > UPLOAD_MAX_MB * 1024 * 1024) return { error: `File is too large. Max ${UPLOAD_MAX_MB} MB.` };
  const data = new Uint8Array(await value.arrayBuffer());
  if (!SIGNATURES[value.type](data)) return { error: "This file looks damaged or isn't really a JPG, PNG, WebP or PDF." };
  return { file: { name: value.name.slice(0, 120), type: value.type, data } };
}
