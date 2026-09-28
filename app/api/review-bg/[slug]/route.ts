// Header background image for a business's public review page
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await db.reviewLink.findUnique({ where: { slug }, select: { bgImage: true, bgImageType: true } });
  if (!link?.bgImage) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(link.bgImage), {
    headers: { "Content-Type": link.bgImageType ?? "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" }, // URL carries ?v=<bgImageAt>
  });
}
