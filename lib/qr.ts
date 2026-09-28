import QRCode from "qrcode";

export function customerUrl(slug: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/r/${slug}`;
}

export function qrDataUrl(url: string) {
  return QRCode.toDataURL(url, { width: 512, margin: 2 });
}
