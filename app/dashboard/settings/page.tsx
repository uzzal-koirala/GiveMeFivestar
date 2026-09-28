// Settings: everything here is loaded from (and saved to) the database
import SettingsView from "@/components/dashboard/SettingsView";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { detailsMode } from "@/lib/details-mode";
import { activePlan } from "@/lib/site";
import { aiReviewsThisMonth, getPayments, parseProducts } from "@/lib/data";
import { enabledMethods, getPlatform } from "@/lib/platform";

export default async function SettingsPage() {
  const user = await requireOwner();
  const [account, link, payments, usedThisMonth, platform, stands] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { phone: true, plan: true, planExpiresAt: true, credits: true, bonusCredits: true } }),
    db.reviewLink.findUnique({ where: { userId: user.id }, omit: { bgImage: true } }),
    getPayments(user.id),
    aiReviewsThisMonth(user.id),
    getPlatform(),
    db.standOrder.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, omit: { proofData: true, designData: true } }),
  ]);

  return (
    <SettingsView
      account={{
        ownerName: user.name, email: user.email, phone: account?.phone ?? "", businessName: user.businessName,
        avatarUrl: user.avatarUrl, plan: activePlan(account?.plan ?? "free", account?.planExpiresAt), credits: account?.credits ?? 0, bonusCredits: account?.bonusCredits ?? 0,
        planExpiresAt: account?.plan !== "free" ? account?.planExpiresAt?.toISOString() ?? null : null,
      }}
      business={link && {
        location: link.location, googleReviewUrl: link.googleReviewUrl, linkedOn: link.createdAt.toISOString(),
        products: parseProducts(link.products), description: link.description,
        tone: link.tone, language: link.language, aiInstructions: link.aiInstructions, keywords: parseProducts(link.keywords),
      }}
      reviewPage={link && {
        slug: link.slug, collectOnly: link.collectOnly, detailsMode: link.collectOnly ? "required" : detailsMode(link),
        facebookUrl: link.facebookUrl, instagramUrl: link.instagramUrl, tiktokUrl: link.tiktokUrl, websiteUrl: link.websiteUrl,
      }}
      design={link && { color: link.themeColor, imageUrl: link.bgImageAt ? `/api/review-bg/${link.slug}?v=${link.bgImageAt.getTime()}` : null }}
      payments={payments}
      standOrders={stands.map((o) => ({
        id: o.id, quantity: o.quantity, amount: o.amount, design: o.design, designName: o.designName, status: o.status,
        fullName: o.fullName, phone: o.phone, address: `${o.address}, ${o.city}, ${o.district}, ${o.province}`,
        createdAt: o.createdAt.toISOString(), shippedAt: o.shippedAt?.toISOString() ?? null, deliveredAt: o.deliveredAt?.toISOString() ?? null,
      }))}
      usedThisMonth={usedThisMonth}
      methods={enabledMethods(platform)}
    />
  );
}
