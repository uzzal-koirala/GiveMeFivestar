// Dashboard shell: only for signed-in business owners
import TopNav from "@/components/dashboard/TopNav";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import OnboardingGate from "@/components/dashboard/OnboardingGate";
import PlanGate, { type PlanGateState } from "@/components/dashboard/PlanGate";
import { AnnouncementBar } from "@/components/admin/PlatformSettings";
import { enabledMethods, getPlatform } from "@/lib/platform";
import { reviewPageStatus } from "@/lib/data";
import PaymentNotices, { type PaymentNotice } from "@/components/dashboard/PaymentNotices";
import SocialReminder from "@/components/dashboard/SocialReminder";
import PaymentTracker, { type TrackedPayment, type TrackerState } from "@/components/dashboard/PaymentTracker";
import { activePlan, creditPacks, planOf } from "@/lib/site";
import Link from "next/link";
import { FaCirclePause, FaArrowRight } from "react-icons/fa6";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOwner();
  const [account, link, platform] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { planChosenAt: true, plan: true, planExpiresAt: true, credits: true } }),
    db.reviewLink.findUnique({ where: { userId: user.id }, select: { id: true, collectOnly: true, websiteUrl: true, facebookUrl: true, instagramUrl: true, tiktokUrl: true } }),
    getPlatform(),
  ]);

  // New accounts pick a plan first; paid plans wait here until the super admin approves the payment
  if (!account?.planChosenAt) {
    const last = await db.paymentRequest.findFirst({
      where: { userId: user.id, kind: "plan" }, orderBy: { createdAt: "desc" },
      select: { item: true, amount: true, method: true, status: true, createdAt: true },
    });
    const [plan, cycle] = (last?.item ?? "").split(":");
    const state: PlanGateState =
      last?.status === "submitted" ? { step: "waiting", payment: { plan, cycle, amount: last.amount, method: last.method, createdAt: last.createdAt.toISOString() } }
      : last?.status === "approved" ? { step: "approved", plan: account?.plan ?? plan, expiresAt: account?.planExpiresAt?.toISOString() ?? null, credits: account?.credits ?? 0 }
      : { step: "pick", ...(last?.status === "rejected" && { rejected: { plan } }) };
    return <PlanGate state={state} methods={enabledMethods(platform)} name={user.name} whatsapp={platform.support.whatsapp} />;
  }

  const { announcement } = platform;
  const noSocials = !!link && !link.websiteUrl && !link.facebookUrl && !link.instagramUrl && !link.tiktokUrl;
  const status = link ? await reviewPageStatus(user.id, link.collectOnly) : { open: true };

  // plan / top-up payments bought from the dashboard: newest approved or rejected the owner hasn't closed, else one still waiting
  const [unseen, waitingPay, ads] = await Promise.all([
    db.paymentRequest.findFirst({ where: { userId: user.id, status: { in: ["approved", "rejected"] }, noticeSeen: false }, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, item: true, amount: true, status: true, createdAt: true } }),
    db.paymentRequest.findFirst({ where: { userId: user.id, status: "submitted" }, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, item: true, amount: true, status: true, createdAt: true } }),
    db.adRequest.findMany({ where: { userId: user.id, paymentStatus: "approved", noticeSeen: false }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, reviews: true, status: true } }),
  ]);
  const tracked = unseen ?? waitingPay;
  let tracker: TrackerState | null = null;
  if (tracked) {
    const [planId, cycle] = tracked.item.split(":");
    const payment: TrackedPayment = {
      id: tracked.id, kind: tracked.kind === "topup" ? "topup" : "plan", amount: tracked.amount, createdAt: tracked.createdAt.toISOString(),
      ...(tracked.kind === "topup" ? { reviews: creditPacks.find((c) => c.id === tracked.item)?.reviews ?? 0 } : { planName: planOf(planId).name, cycle }),
    };
    const unlimited = planOf(activePlan(account?.plan ?? "free", account?.planExpiresAt)).reviews === null;
    tracker = tracked.status === "approved" ? { status: "approved", payment, credits: unlimited ? null : account?.credits ?? 0, expiresAt: account?.planExpiresAt?.toISOString() ?? null }
      : tracked.status === "rejected" ? { status: "rejected", payment }
      : { status: "waiting", payment };
  }
  const notices: PaymentNotice[] = ads.map((a) => ({
    id: a.id, source: "ad", kind: "ad", title: "Your ad payment is approved",
    text: a.status === "completed" ? `Your ad for ${a.reviews.toLocaleString()} reviews is complete.` : `Your ad for ${a.reviews.toLocaleString()} reviews is now running. Track it on the Ads page.`,
  }));
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav variant="owner" ownerName={user.name} email={user.email} avatarUrl={user.avatarUrl} />
      {!link && <OnboardingGate businessName={user.businessName} ownerName={user.name} />}
      {tracker && <PaymentTracker key={`${tracker.payment.id}-${tracker.status}`} state={tracker} whatsapp={platform.support.whatsapp} />}
      {/* Navy band that page content overlaps; notices sit inside it so they never push text onto white */}
      <div className="bg-blue-950">
        {((announcement.enabled && announcement.text) || !status.open || notices.length > 0 || noSocials) && (
          <div className="mx-auto max-w-6xl space-y-3 px-4 pt-6 sm:px-6">
        {announcement.enabled && announcement.text && <AnnouncementBar a={announcement} />}
            <PaymentNotices notices={notices} />
            {noSocials && <SocialReminder />}
        {!status.open && (
          <div role="alert" className="flex flex-wrap items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm ring-2 ring-rose-300">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600"><FaCirclePause className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Your review page is paused</p>
              <p className="text-sm text-slate-600">
                {"reason" in status && status.reason === "limit"
                  ? `You've used this month's ${status.limit} reviews on the Free plan. It starts again on the 1st, or upgrade for more.`
                  : "You've used all your AI reviews."} Customers who scan your QR code now see &ldquo;not accepting reviews&rdquo;.
              </p>
            </div>
            <Link href="/dashboard/settings?tab=subscription" className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 sm:w-auto">
              Upgrade plan <FaArrowRight className="size-3" />
            </Link>
            {"reason" in status && status.reason === "credits" && activePlan(account?.plan ?? "free", account?.planExpiresAt) === "pro" && (
              <Link href="/dashboard/settings?tab=ai" className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-blue-800 ring-1 ring-slate-200 hover:bg-slate-50 sm:w-auto">Top up</Link>
            )}
          </div>
        )}
          </div>
        )}
        {/* taller on phones, where page titles wrap onto more lines */}
        <div className="h-52 sm:h-40" />
      </div>
      <main className="mx-auto -mt-44 max-w-6xl px-4 pb-16 sm:-mt-32 sm:px-6">
        {children}
      </main>
    </div>
  );
}
