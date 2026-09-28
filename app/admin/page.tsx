// Super admin overview: same layout as the business dashboard, platform-wide data
import Link from "next/link";
import { MdWavingHand } from "react-icons/md";
import { FaEnvelope,
  FaSackDollar, FaMoneyCheckDollar, FaBullhorn, FaHeadset, FaArrowRight, FaCircleCheck,
  FaChartLine, FaCrown, FaBolt, FaUserPlus, FaTicket, FaMessage,
} from "react-icons/fa6";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { npr } from "@/components/ui/PaymentMethods";
import ReviewsChart from "@/components/dashboard/ReviewsChart";
import { Delta } from "@/components/dashboard/Stat";
import Tile from "@/components/admin/Tile";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { activePlan, plans } from "@/lib/site";

const DAY = 864e5;

const card = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";
const dayKey = (d: Date | number) => new Date(d).toLocaleDateString("en-CA");
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 6e4);
  return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};
const TICKET_STYLE: Record<string, { label: string; pill: string; bar: string }> = {
  open: { label: "Open", pill: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500" },
  in_progress: { label: "In progress", pill: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-400" },
  resolved: { label: "Resolved", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500" },
  closed: { label: "Closed", pill: "bg-slate-100 text-slate-600 ring-slate-200", bar: "bg-slate-300" },
};
const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
  business: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
};
const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default async function AdminOverview() {
  const admin = await requireSuperAdmin();
  const now = Date.now();
  const today = new Date(now).setHours(0, 0, 0, 0);

  const [
    signupsToday,
    pendingPayments, pendingAds, openTickets, newMessages, approvedPayments, approvedAds, recentResponses,
    recentUsers, latestTickets,
  ] = await Promise.all([
    db.user.count({ where: { role: "owner", createdAt: { gte: new Date(today) } } }),
    db.paymentRequest.count({ where: { status: "submitted" } }),
    db.adRequest.count({ where: { paymentStatus: "submitted" } }),
    db.ticket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    db.contactMessage.count({ where: { status: "new" } }),
    db.paymentRequest.findMany({ where: { status: "approved" }, select: { kind: true, amount: true, createdAt: true } }),
    db.adRequest.findMany({ where: { paymentStatus: "approved" }, select: { reviews: true, pricePerReview: true, createdAt: true } }),
    db.submission.findMany({ where: { source: "qr", createdAt: { gte: new Date(today - 27 * DAY) } }, select: { createdAt: true } }),
    db.user.findMany({ where: { role: "owner" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, businessName: true, createdAt: true, plan: true, planExpiresAt: true, avatarAt: true, link: { select: { location: true } } } }),
    db.ticket.findMany({
      orderBy: { updatedAt: "desc" }, take: 5,
      select: { id: true, subject: true, category: true, status: true, updatedAt: true, user: { select: { id: true, businessName: true, avatarAt: true } }, _count: { select: { messages: true } } },
    }),
  ]);

  // money
  const adMoney = (a: { reviews: number; pricePerReview: number }) => a.reviews * a.pricePerReview;
  // approved money from requests sent that day
  const earnedOn = (from: number, to: number) =>
    approvedPayments.filter((p) => p.createdAt.getTime() >= from && p.createdAt.getTime() < to).reduce((n, p) => n + p.amount, 0) +
    approvedAds.filter((a) => a.createdAt.getTime() >= from && a.createdAt.getTime() < to).reduce((n, a) => n + adMoney(a), 0);
  const earnedToday = earnedOn(today, today + DAY);
  const toApprove = pendingPayments + pendingAds;

  // chart: responses per day, last 14 days (vs the 14 before)
  const last14 = recentResponses.filter((r) => r.createdAt.getTime() >= today - 13 * DAY).length;
  const prev14 = recentResponses.length - last14;
  const chart = Array.from({ length: 14 }, (_, i) => {
    const t = today - (13 - i) * DAY;
    return { label: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: recentResponses.filter((r) => dayKey(r.createdAt) === dayKey(t)).length };
  });

  // each tile has its own colour when something is waiting
  const queue = [
    { count: pendingPayments, label: "Payments", hint: "to verify", href: "/admin/payments", Icon: FaMoneyCheckDollar, on: "border-amber-200 bg-amber-50", icon: "bg-amber-400 text-white", num: "text-amber-700" },
    { count: pendingAds, label: "Ads", hint: "to approve", href: "/admin/ads", Icon: FaBullhorn, on: "border-violet-200 bg-violet-50", icon: "bg-violet-500 text-white", num: "text-violet-700" },
    { count: openTickets, label: "Tickets", hint: "open", href: "/admin/support", Icon: FaHeadset, on: "border-rose-200 bg-rose-50", icon: "bg-rose-500 text-white", num: "text-rose-700" },
    { count: newMessages, label: "Messages", hint: "new from the website", href: "/admin/messages", Icon: FaEnvelope, on: "border-sky-200 bg-sky-50", icon: "bg-sky-500 text-white", num: "text-sky-700" },
  ];
  const queueTotal = pendingPayments + pendingAds + openTickets + newMessages;


  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-200">
            {new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-white">
            Welcome back, {admin.name.split(" ")[0]} <MdWavingHand className="text-amber-300" />
          </h1>
        </div>
        <span className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${queueTotal ? "bg-amber-300 text-blue-950" : "bg-white/10 text-white"}`}>
          {queueTotal ? <><FaBolt /> {queueTotal} item{queueTotal === 1 ? "" : "s"} need you</> : <><FaCircleCheck /> All caught up</>}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile href="/admin/businesses" label="Signups today" value={signupsToday} Icon={FaUserPlus} color="blue" />
        <Tile label="Earning today" value={npr(earnedToday)} Icon={FaSackDollar} color="emerald" />
        <Tile href="/admin/support" label="Tickets open" value={openTickets} Icon={FaTicket} color={openTickets ? "rose" : "calm"} />
        <Tile href={pendingPayments || !pendingAds ? "/admin/payments" : "/admin/ads"} label="Payment approval" value={toApprove} Icon={FaMoneyCheckDollar}
          color={toApprove ? "amber" : "calm"} />
      </div>

      {/* Chart + queue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${card} flex flex-col lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaChartLine className="text-blue-700" /> Platform responses per day</h2>
              <p className="mt-0.5 text-sm text-slate-500">All businesses · last 14 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-slate-900">{last14}</p>
              <p className="mt-0.5 flex items-center justify-end gap-2 text-xs text-slate-500"><Delta now={last14} before={prev14} /> vs previous 14 days</p>
            </div>
          </div>
          <div className="mt-6 flex-1"><ReviewsChart data={chart} /></div>
        </section>

        <section className={`${card} flex flex-col`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaBolt className="text-amber-500" /> Needs your attention</h2>
              <p className="mt-0.5 text-sm text-slate-500">Things waiting on a super admin</p>
            </div>
            {queueTotal ? (
              <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-bold text-blue-950">{queueTotal} waiting</span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><FaCircleCheck className="size-3" /> All clear</span>
            )}
          </div>
          <ul className="mt-5 flex-1 space-y-2.5">
            {queue.map(({ count, label, hint, href, Icon, on, icon, num }) => (
              <li key={label}>
                <Link href={href}
                  className={`group flex items-center gap-3.5 rounded-xl border px-3.5 py-3 transition hover:-translate-y-0.5 hover:shadow-md ${count ? on : "border-slate-100 bg-white hover:border-slate-200"}`}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg shadow-sm ${count ? icon : "bg-slate-100 text-slate-400"}`}><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{label}</span>
                    <span className="block text-xs text-slate-500">{count ? `${count} ${hint}` : "Nothing waiting"}</span>
                  </span>
                  {count ? (
                    <span className={`text-2xl font-extrabold tabular-nums ${num}`}>{count}</span>
                  ) : (
                    <FaCircleCheck className="size-4 text-emerald-400" />
                  )}
                  <FaArrowRight className="size-3 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Tickets + sign-ups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <FaTicket className="text-rose-500" /> Latest tickets
            </h2>
            <Link href="/admin/support" className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">All <FaArrowRight className="size-3" /></Link>
          </div>
          {latestTickets.length ? (
            <ul className="mt-4 space-y-2.5">
              {latestTickets.map((t) => {
                const st = TICKET_STYLE[t.status] ?? TICKET_STYLE.open;
                const who = t.user.businessName;
                return (
                  <li key={t.id}>
                    <Link href={`/admin/support?ticket=${t.id}`}
                      className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-slate-200 py-3 pl-5 pr-4 transition hover:border-slate-300 hover:shadow-sm">
                      <span className={`absolute inset-y-0 left-0 w-1 ${st.bar}`} />
                      {t.user.avatarAt ? (
                        <img src={`/api/avatar/${t.user.id}?v=${t.user.avatarAt.getTime()}`} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${colorFor(who)}`}>{initials(who)}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{t.subject}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{who}</span>
                          <span className="text-slate-300">·</span> {t.category}
                          <span className="text-slate-300">·</span> {ago(t.updatedAt)}
                        </p>
                      </div>
                      <span className="hidden items-center gap-1 text-xs text-slate-400 sm:flex"><FaMessage className="size-3" /> {t._count.messages}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${st.pill}`}>{st.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
              <FaTicket className="size-7 text-slate-200" />
              <p className="mt-3 font-semibold text-slate-700">No tickets yet</p>
              <p className="mt-1 text-sm text-slate-500">Support tickets from businesses will show up here.</p>
            </div>
          )}
        </section>

        <section className={`${card} flex flex-col`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaUserPlus className="text-blue-700" /> Recent signups</h2>
            <Link href="/admin/businesses" className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">All <FaArrowRight className="size-3" /></Link>
          </div>
          {recentUsers.length ? (
            <ul className="mt-2 -mx-2">
              {recentUsers.map((u) => {
                const plan = activePlan(u.plan, u.planExpiresAt);
                return (
                  <li key={u.id}>
                    <Link href={`/admin/businesses/${u.id}`} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
                      {u.avatarAt ? (
                        <img src={`/api/avatar/${u.id}?v=${u.avatarAt.getTime()}`} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white ${colorFor(u.businessName)}`}>{initials(u.businessName)}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-blue-800">{u.businessName}</span>
                        <span className="block truncate text-xs text-slate-500">{u.link?.location ? `${u.link.location} · ` : ""}{ago(u.createdAt)}</span>
                      </span>
                      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${PLAN_BADGE[plan]}`}>
                        {plan !== "free" && <FaCrown className="size-2.5" />} {plans.find((p) => p.id === plan)?.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No sign-ups yet.</p>
          )}

        </section>
      </div>
    </div>
  );
}
