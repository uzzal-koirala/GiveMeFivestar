// Payment proof files, for the super admin only. kind = payment | ad
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  if ((await getCurrentUser())?.role !== "super_admin") return new Response("Forbidden", { status: 403 });
  const { kind, id } = await params;
  const file =
    kind === "payment"
      ? await db.paymentRequest.findUnique({ where: { id }, select: { proofName: true, proofType: true, proofData: true } }).then((p) => p && { name: p.proofName, type: p.proofType, data: p.proofData })
      : kind === "ad"
        ? await db.adRequest.findUnique({ where: { id }, select: { paymentProof: true, paymentProofType: true, paymentProofData: true } }).then((a) => a?.paymentProofData && { name: a.paymentProof ?? "proof", type: a.paymentProofType ?? "application/octet-stream", data: a.paymentProofData })
        : null;
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.type, "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`, "Cache-Control": "private, no-store" },
  });
}
