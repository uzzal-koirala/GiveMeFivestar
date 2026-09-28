// Owner dashboard overview
import Link from "next/link";
import { MdWavingHand } from "react-icons/md";
import { FaStar, FaCalendarWeek, FaBolt, FaArrowTrendUp, FaArrowTrendDown, FaArrowRight, FaChartLine, FaQuoteLeft, FaSun, FaPlus, FaLock, FaCommentDots } from "react-icons/fa6";
import type { IconType } from "react-icons";
import ReviewsChart from "@/components/dashboard/ReviewsChart";
import { Delta, Stat } from "@/components/dashboard/Stat";
import QrCard from "@/components/dashboard/QrCard";
import GoogleLinkCard from "@/components/dashboard/GoogleLinkCard";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { aiReviewsThisMonth, getCustomers } from "@/lib/data";
import { activePlan, aiReviewsLeft, planOf } from "@/lib/site";
import type { Customer } from "@/lib/types";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { OpenSetupButton } from "@/components/dashboard/OnboardingGate";
import AdBadge from "@/components/ui/AdBadge";

const DAY = 864e5;
const dayKey = (t: number) => new Date(t).toLocaleDateString("en-CA"); // local YYYY-MM-DD
const countBetween = (items: Customer[], from: number, to = Infinity) =>
  items.filter((c) => { const t = Date.parse(c.date); return t >= from && t < to; }).length;
const card = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

function SetupPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
      <span className="grid size-14 place-items-center rounded-xl bg-amber-100 text-amber-600"><FaLock className="size-5" /></span>
      <h2 className="mt-4 font-bold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>
      <OpenSetupButton className="mt-5 flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
        Complete setup <FaArrowRight className="size-3" />
      </OpenSetupButton>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireOwner();
  const [link, account, all] = await Promise.all([
    db.reviewLink.findUnique({ where: { userId: user.id }, omit: { bgImage: true } }),
    db.user.findUnique({ where: { id: user.id }, select: { credits: true, bonusCredits: true, plan: true, planExpiresAt: true } }),
    getCustomers(user.id),
  ]);
  const responses = all.filter((c) => c.source !== "import"); // real reviews + feedback, not CSV imports
  const now = Date.now();
  const today = new Date(now).setHours(0, 0, 0, 0); // local midnight, same day as the greeting

  const todayCount = countBetween(responses, today);
  const yesterday = countBetween(responses, today - DAY, today);
  const week = countBetween(responses, today - 6 * DAY);
  const prevWeek = countBetween(responses, today - 13 * DAY, today - 6 * DAY);
  const last14 = countBetween(responses, today - 13 * DAY);
  const prev14 = countBetween(responses, today - 27 * DAY, today - 13 * DAY);
  const planId = activePlan(account?.plan ?? "free", account?.planExpiresAt);
  const allowance = planOf(planId).reviews;
  const creditsLeft = aiReviewsLeft(planId, account?.credits ?? 0, await aiReviewsThisMonth(user.id), account?.bonusCredits ?? 0) ?? 0;
  const unlimitedAi = allowance === null;
  const isFree = planId === "free";
  const creditsLow = !unlimitedAi && creditsLeft / allowance <= 0.25;

  const chart = Array.from({ length: 14 }, (_, i) => {
    const t = today - (13 - i) * DAY;
    return {
      label: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: responses.filter((c) => dayKey(Date.parse(c.date)) === dayKey(t)).length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm font-medium text-blue-200">
          {new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-white">
          Welcome back, {user.businessName} <MdWavingHand className="text-amber-300" />
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Total responses" value={responses.length} Icon={FaStar} tint="bg-amber-100 text-amber-700" />
        <Stat label="Today" value={todayCount} Icon={FaSun} tint="bg-violet-100 text-violet-700" aside={<Delta now={todayCount} before={yesterday} />} />
        <Stat label="This week" value={week} Icon={FaCalendarWeek} tint="bg-blue-100 text-blue-800" aside={<Delta now={week} before={prevWeek} />} />
        <Stat
          label={isFree ? "AI reviews left this month" : "AI reviews left"} value={unlimitedAi ? "Unlimited" : isFree && !account?.bonusCredits ? `${creditsLeft} / ${allowance}` : creditsLeft} Icon={FaBolt}
          tint={creditsLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}
          aside={
            <Link href={isFree ? "/dashboard/settings?tab=subscription" : "/dashboard/settings?tab=ai"} aria-label={isFree ? "Upgrade for more AI reviews" : "Top up AI reviews"} title={isFree ? "Upgrade" : "Top up"} className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-900 text-white transition hover:bg-blue-800">
              <FaPlus className="size-3" />
            </Link>
          }
        />
      </div>

      {/* QR (left) + chart (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {link ? (
          <QrCard slug={link.slug} />
        ) : (
          <SetupPlaceholder title="Your review QR" text="Add your Google review link to get a QR code customers can scan." />
        )}

        <section className={`${card} flex flex-col lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaChartLine className="text-blue-700" /> Responses per day</h2>
              <p className="mt-0.5 text-sm text-slate-500">Last 14 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-slate-900">{last14}</p>
              <p className="mt-0.5 flex items-center justify-end gap-2 text-xs text-slate-500"><Delta now={last14} before={prev14} /> vs previous 14 days</p>
            </div>
          </div>
          <div className="mt-6 flex-1">
            <ReviewsChart data={chart} />
          </div>
        </section>
      </div>

      {/* Latest reviews + Google link */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaQuoteLeft className="text-blue-700" /> Latest responses</h2>
            <Link href="/dashboard/reviews" className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
              View all <FaArrowRight className="size-3" />
            </Link>
          </div>
          {!responses.length && (
            <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <FaQuoteLeft className="size-7 text-slate-200" />
              <p className="mt-3 font-semibold text-slate-700">No responses yet</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">Share your QR code with customers. Their reviews and feedback will show up here.</p>
            </div>
          )}
          <ul className="mt-4 divide-y divide-slate-100">
            {responses.slice(0, 4).map((c) => (
              <li key={c.id} className="flex gap-4 py-4 last:pb-0">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${colorFor(c.name)}`}>
                  {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <FaStar key={n} className={`size-3 ${n <= (c.rating ?? 0) ? "text-amber-400" : "text-slate-200"}`} />)}</div>
                    {!c.review && <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"><FaCommentDots className="size-2.5" /> Feedback</span>}
                    <span className="ml-auto flex items-center gap-2">
                      {c.adId && <AdBadge adId={c.adId} compact />}
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">{c.product}</span>
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{c.review || c.feedback || <span className="text-slate-400">No comment</span>}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {link ? (
          <GoogleLinkCard businessName={link.businessName} url={link.googleReviewUrl} linkedOn={link.createdAt} />
        ) : (
          <SetupPlaceholder title="Google Business" text="Connect your Google Business review link so customers land in the right place." />
        )}
      </div>
    </div>
  );
}
