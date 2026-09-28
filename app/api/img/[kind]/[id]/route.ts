// Public images for website content: kind = testimonial | blog | brand (PNG logo)
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const data =
    kind === "testimonial" ? (await db.testimonial.findUnique({ where: { id }, select: { photo: true } }))?.photo
    : kind === "blog" ? (await db.blogPost.findUnique({ where: { id }, select: { cover: true } }))?.cover
    : kind === "brand" ? (await db.brandLogo.findUnique({ where: { id }, select: { logo: true } }))?.logo
    : null;
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), { headers: { "Content-Type": kind === "brand" ? "image/png" : "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } }); // URL carries ?v=
}
