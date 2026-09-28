// Ad requests: verify payment, then track delivery
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatform } from "@/lib/platform";
import { PageTitle } from "@/components/admin/ui";
import AdsBoard from "@/components/admin/AdsBoard";

export default async function AdminAds() {
  await requireSuperAdmin();
  const [rows, platform] = await Promise.all([
    db.adRequest.findMany({ orderBy: { createdAt: "desc" }, omit: { paymentProofData: true }, include: { user: { select: { id: true, businessName: true, email: true, avatarAt: true } } } }),
    getPlatform(),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Ads" desc="Approve paid ads to start them, then update how many reviews were delivered." />
      <AdsBoard items={rows.map((a) => ({
        id: a.id, userId: a.user.id, business: a.user.businessName, email: a.user.email,
        logoUrl: a.user.avatarAt ? `/api/avatar/${a.user.id}?v=${a.user.avatarAt.getTime()}` : null,
        reviews: a.reviews, delivered: a.delivered, pricePerReview: a.pricePerReview, notes: a.notes,
        status: a.status, paymentStatus: a.paymentStatus,
        method: platform.methods.find((m) => m.id === a.paymentMethod)?.label ?? a.paymentMethod ?? "",
        txnId: a.paymentRef ?? "", date: a.createdAt.toISOString(),
        proofUrl: `/api/admin/proof/ad/${a.id}`, proofIsImage: (a.paymentProofType ?? "").startsWith("image/"),
      }))} />
    </div>
  );
}
