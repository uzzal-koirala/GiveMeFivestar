// Super admin: one business, everything about it, and what can be done to it
import { requireSuperAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaArrowLeft, FaPhone, FaEnvelope, FaArrowUpRightFromSquare, FaStar, FaWandMagicSparkles, FaBolt, FaSackDollar, FaCalendar, FaCrown, FaBan, FaLocationDot, FaHourglassHalf, FaGlobe, FaFacebookF, FaInstagram, FaTiktok,
} from "react-icons/fa6";
import { db } from "@/lib/db";
import { parseProducts } from "@/lib/data";
import { detailsMode } from "@/lib/details-mode";
import { activePlan, addMonths, plans, creditPacks } from "@/lib/site";
import { npr } from "@/components/ui/PaymentMethods";
import { Stat } from "@/components/dashboard/Stat";
import { fmtDate } from "@/components/admin/ui";
import BusinessActivity from "@/components/admin/BusinessActivity";
import BusinessManage from "@/components/admin/BusinessManage";
import BusinessDetails from "@/components/admin/BusinessDetails";
import AdminNote from "@/components/admin/AdminNote";
import PlanHistory from "@/components/admin/PlanHistory";
import { getPlatform } from "@/lib/platform";

const card = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

// "2 months 5 days" until the plan ends
function timeLeft(end: Date) {
  const now = new Date();
  let months = 0;
  // count to the nearest day, so a plan set seconds ago still reads "3 months"
  while (addMonths(now, months + 1).getTime() - end.getTime() < 864e5 / 2) months++;
  const days = Math.max(0, Math.round((end.getTime() - addMonths(now, months).getTime()) / 864e5));
  const part = (n: number, w: string) => (n ? `${n} ${w}${n > 1 ? "s" : ""}` : "");
  return [part(months, "month"), part(days, "day")].filter(Boolean).join(" ") || "Less than a day";
}

export default async function BusinessProfile({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const u = await db.user.findFirst({
    where: { id, role: "owner" },
    include: {
      link: true,
      payments: { orderBy: { createdAt: "desc" }, omit: { proofData: true } },
      ads: { orderBy: { createdAt: "desc" }, omit: { paymentProofData: true } },
      tickets: { orderBy: { updatedAt: "desc" }, include: { _count: { select: { messages: true } } } },
      planChanges: { orderBy: { createdAt: "desc" } },
      _count: { select: { sessions: true } },
    },
    omit: { passwordHash: true, avatar: true },
  });
  if (!u) notFound();

  const { methods } = await getPlatform();
  const subs = u.link
    ? await db.submission.findMany({ where: { linkId: u.link.id }, orderBy: { createdAt: "desc" } })
    : [];
  const responses = subs.filter((s) => s.source === "qr");
  const aiReviews = responses.filter((s) => s.generatedText).length;
  const feedback = responses.length - aiReviews;
  const paid =
    u.payments.filter((p) => p.status === "approved").reduce((n, p) => n + p.amount, 0) +
    u.ads.filter((a) => a.paymentStatus === "approved").reduce((n, a) => n + a.reviews * a.pricePerReview, 0);
  const openTickets = u.tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const plan = plans.find((p) => p.id === activePlan(u.plan, u.planExpiresAt)) ?? plans[0];
  const logo = u.avatarAt ? `/api/avatar/${u.id}?v=${u.avatarAt.getTime()}` : null;
  const initials = u.businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const products = u.link ? parseProducts(u.link.products) : [];
  const socials = [
    { href: u.link?.websiteUrl, label: "Website", Icon: FaGlobe, cls: "bg-blue-700" },
    { href: u.link?.facebookUrl, label: "Facebook", Icon: FaFacebookF, cls: "bg-[#1877F2]" },
    { href: u.link?.instagramUrl, label: "Instagram", Icon: FaInstagram, cls: "bg-[#E4405F]" },
    { href: u.link?.tiktokUrl, label: "TikTok", Icon: FaTiktok, cls: "bg-slate-900" },
  ].filter((x) => x.href);
  const expired = u.plan !== "free" && plan.id === "free";
  const daysLeft = u.planExpiresAt ? (u.planExpiresAt.getTime() - Date.now()) / 864e5 : null;
  const sub = u.plan === "free"
    ? { tone: "bg-slate-50 text-slate-600 ring-slate-200", title: "Free plan", detail: "No end date" }
    : expired
      ? { tone: "bg-rose-50 text-rose-700 ring-rose-200", title: `${plans.find((p) => p.id === u.plan)?.name} expired`, detail: `Ended ${fmtDate(u.planExpiresAt!)}` }
      : !u.planExpiresAt
        ? { tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", title: `${plan.name} · no end date`, detail: "Runs until changed" }
        : { tone: daysLeft! <= 7 ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200",
            title: `${timeLeft(u.planExpiresAt)} left`, detail: `${plan.name} ends ${fmtDate(u.planExpiresAt)}` };

  return (
    <div className="space-y-6">
      <Link href="/admin/businesses" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white">
        <FaArrowLeft className="size-3" /> All businesses
      </Link>

      {/* Header */}
      <section className={`${card} flex flex-wrap items-center gap-5`}>
        {logo ? (
          <img src={logo} alt="" className="size-20 rounded-2xl object-cover ring-4 ring-slate-100" />
        ) : (
          <span className="grid size-20 place-items-center rounded-2xl bg-blue-950 text-2xl font-extrabold text-white ring-4 ring-slate-100">{initials}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{u.businessName}</h1>
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"><FaCrown className="size-3" /> {plan.name}</span>
            {u.suspended ? (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"><FaBan className="size-3" /> Suspended</span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
            )}
            {!u.link && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Setup not finished</span>}
          </div>
          <p className="mt-1 text-sm text-slate-600">{u.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 hover:text-blue-700"><FaEnvelope className="size-3" /> {u.email}</a>
            {u.phone && <a href={`tel:${u.phone}`} className="flex items-center gap-1.5 hover:text-blue-700"><FaPhone className="size-3" /> {u.phone}</a>}
            {u.link?.location && <span className="flex items-center gap-1.5"><FaLocationDot className="size-3" /> {u.link.location}</span>}
            <span className="flex items-center gap-1.5"><FaCalendar className="size-3" /> Joined {fmtDate(u.createdAt)}</span>
          </p>
          {socials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {socials.map(({ href, label, Icon, cls }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                  className={`grid size-8 place-items-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${cls}`}>
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ring-1 ${sub.tone}`}>
            <FaHourglassHalf className="size-4 shrink-0" />
            <div className="leading-tight">
              <p className="text-sm font-bold">{sub.title}</p>
              <p className="text-xs opacity-80">{sub.detail}</p>
            </div>
          </div>
        {u.link && (
          <a href={`/r/${u.link.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
            Review page <FaArrowUpRightFromSquare className="size-3" />
          </a>
        )}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Customer responses" value={responses.length} Icon={FaStar} tint="bg-amber-100 text-amber-700" />
        <Stat label="AI reviews · feedback" value={`${aiReviews} · ${feedback}`} Icon={FaWandMagicSparkles} tint="bg-violet-100 text-violet-700" />
        <Stat label={plan.id === "free" ? "Bonus AI reviews" : "AI credits left"} value={plan.id === "free" ? u.bonusCredits : plan.reviews === null ? "Unlimited" : u.credits + u.bonusCredits} Icon={FaBolt} tint="bg-emerald-100 text-emerald-700" />
        <Stat label="Total paid" value={npr(paid)} Icon={FaSackDollar} tint="bg-blue-100 text-blue-800" />
      </div>

      <AdminNote userId={u.id} note={u.adminNote} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: business info + activity */}
        <div className="space-y-6 lg:col-span-2">
          <BusinessDetails
            userId={u.id}
            slug={u.link?.slug ?? null}
            initial={{
              businessName: u.businessName, phone: u.phone ?? "", photo: logo ?? "", location: u.link?.location ?? "", description: u.link?.description ?? "",
              googleReviewUrl: u.link?.googleReviewUrl ?? "", products,
              facebookUrl: u.link?.facebookUrl ?? "", instagramUrl: u.link?.instagramUrl ?? "", tiktokUrl: u.link?.tiktokUrl ?? "", websiteUrl: u.link?.websiteUrl ?? "",
              tone: u.link?.tone ?? "friendly", collectOnly: u.link?.collectOnly ?? false,
              detailsMode: u.link ? (u.link.collectOnly ? "required" : detailsMode(u.link)) : "required",
            }}
          />

          <PlanHistory
            joined={u.createdAt.toISOString()} plan={u.plan} planExpiresAt={u.planExpiresAt?.toISOString() ?? null}
            changes={u.planChanges.map((c) => ({
              ...c, expiresAt: c.expiresAt?.toISOString() ?? null, createdAt: c.createdAt.toISOString(),
              method: methods.find((m) => m.id === c.method)?.label ?? c.method,
            }))}
          />

          <BusinessActivity
            payments={u.payments.map((p) => ({
              id: p.id, title: p.kind === "topup" ? `Top-up · ${creditPacks.find((c) => c.id === p.item)?.reviews ?? "?"} AI reviews` : `Upgrade · ${plans.find((x) => x.id === p.item.split(":")[0])?.name ?? p.item} (${p.item.split(":")[1]})`,
              amount: p.amount, status: p.status, date: p.createdAt.toISOString(),
            }))}
            ads={u.ads.map((a) => ({ id: a.id, title: `${a.reviews} reviews · Rs ${a.pricePerReview}/review`, delivered: a.delivered, reviews: a.reviews, amount: a.reviews * a.pricePerReview, status: a.status, date: a.createdAt.toISOString() }))}
            tickets={u.tickets.map((t) => ({ id: t.id, subject: t.subject, category: t.category, status: t.status, messages: t._count.messages, date: t.updatedAt.toISOString() }))}
          />
        </div>

        {/* Right: actions */}
        <BusinessManage
          business={{
            id: u.id, businessName: u.businessName, email: u.email, plan: u.plan, planExpiresAt: u.planExpiresAt?.toISOString() ?? null, credits: u.credits, bonusCredits: u.bonusCredits, activePlan: plan.id, suspended: u.suspended,
            suspendedAt: u.suspendedAt?.toISOString() ?? null, googleReviewUrl: u.link?.googleReviewUrl ?? null,
            sessions: u._count.sessions, openTickets, ads: u.ads.length,
          }}
        />
      </div>
    </div>
  );
}
