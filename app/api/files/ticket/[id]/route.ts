// Download a ticket attachment (the ticket's owner or a super admin)
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const m = await db.ticketMessage.findFirst({
    where: user.role === "super_admin" ? { id } : { id, ticket: { userId: user.id } }, // admins see every ticket
    select: { attachment: true, attachmentType: true, attachmentData: true },
  });
  if (!m?.attachmentData) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.attachmentData), {
    headers: {
      "Content-Type": m.attachmentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(m.attachment ?? "attachment")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
