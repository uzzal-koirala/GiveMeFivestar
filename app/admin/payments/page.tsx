// Plan upgrades and AI review top-ups: verify proofs, then see every decision as history
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatform } from "@/lib/platform";
import { creditPacks, planOf } from "@/lib/site";
import { PageTitle } from "@/components/admin/ui";
import Tile from "@/components/admin/Tile";
import PaymentsBoard from "@/components/admin/PaymentsBoard";
import { npr } from "@/components/ui/PaymentMethods";
import { FaHourglassHalf, FaSackDollar, FaCircleCheck, FaCircleXmark } from "react-icons/fa6";

export default async function AdminPayments() {
  await requireSuperAdmin();
  const [rows, platform] = await Promise.all([
    db.paymentRequest.findMany({ orderBy: { createdAt: "desc" }, omit: { proofData: true }, include: { user: { select: { id: true, businessName: true, email: true, avatarAt: true } } } }),
    getPlatform(),
  ]);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const waiting = rows.filter((p) => p.status === "submitted");
  const approved = rows.filter((p) => p.status === "approved");
  const approvedMonth = approved.filter((p) => (p.decidedAt ?? p.createdAt) >= monthStart);

  return (
    <div className="space-y-6">
      <PageTitle title="Payments" desc="Check each proof, then approve to apply the plan or AI reviews. Every decision is kept in History." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="Waiting" value={waiting.length} Icon={FaHourglassHalf} color={waiting.length ? "amber" : "calm"} />
        <Tile label="Waiting amount" value={npr(waiting.reduce((n, p) => n + p.amount, 0))} Icon={FaSackDollar} color={waiting.length ? "blue" : "calm"} />
        <Tile label="Approved this month" value={npr(approvedMonth.reduce((n, p) => n + p.amount, 0))} Icon={FaCircleCheck} color="emerald" />
        <Tile label="Rejected" value={rows.filter((p) => p.status === "rejected").length} Icon={FaCircleXmark} color="calm" />
      </div>
      <PaymentsBoard items={rows.map((p) => {
        const [planId, cycle] = p.item.split(":");
        const pack = creditPacks.find((c) => c.id === p.item);
        return {
          id: p.id, userId: p.user.id, business: p.user.businessName, email: p.user.email,
          logoUrl: p.user.avatarAt ? `/api/avatar/${p.user.id}?v=${p.user.avatarAt.getTime()}` : null,
          kind: p.kind === "topup" ? "topup" : "plan",
          title: p.kind === "topup" ? `${pack?.reviews.toLocaleString() ?? "?"} AI reviews` : `${planOf(planId).name} plan · ${cycle}`,
          detail: p.kind === "topup" ? "Credits are added as soon as you approve." : `Starts or extends ${planOf(planId).name} for ${cycle === "yearly" ? "12 months" : "1 month"} when approved.`,
          amount: p.amount, method: platform.methods.find((m) => m.id === p.method)?.label ?? p.method, txnId: p.txnId,
          date: p.createdAt.toISOString(), status: p.status as "submitted" | "approved" | "rejected",
          decidedAt: p.decidedAt?.toISOString() ?? null, decidedBy: p.decidedBy,
          proofUrl: `/api/admin/proof/payment/${p.id}`, proofIsImage: p.proofType.startsWith("image/"),
        };
      })} />
    </div>
  );
}
