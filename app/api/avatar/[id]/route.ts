// Serves a user's profile photo stored in the database
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { avatar: true } });
  if (!user?.avatar) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(user.avatar), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" }, // URL carries ?v=<avatarAt>
  });
}
