// QR stand order files for the super admin: file = proof | design
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  if ((await getCurrentUser())?.role !== "super_admin") return new Response("Forbidden", { status: 403 });
  const { id, file } = await params;
  const o = await db.standOrder.findUnique({ where: { id }, select: { proofName: true, proofType: true, proofData: true, designName: true, designType: true, designData: true } });
  const f = !o ? null : file === "proof" ? { name: o.proofName, type: o.proofType, data: o.proofData }
    : file === "design" && o.designData ? { name: o.designName ?? "design", type: o.designType ?? "application/octet-stream", data: o.designData } : null;
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.data), {
    headers: { "Content-Type": f.type, "Content-Disposition": `inline; filename="${encodeURIComponent(f.name)}"`, "Cache-Control": "private, no-store" },
  });
}
