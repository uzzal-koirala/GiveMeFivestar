"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FaCrown, FaUserGear, FaTriangleExclamation, FaCheck, FaCircleExclamation, FaEye, FaEyeSlash,
  FaRightFromBracket, FaBan, FaCircleCheck, FaTrashCan, FaCalendarCheck,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import {
  addCredits, changeBusinessEmail, deleteBusiness, logoutEverywhere, resetBusinessPassword, 
  setBusinessPlan, setSuspended,
} from "@/app/actions/admin";
import { addMonths, plans } from "@/lib/site";

type Business = {
  id: string; businessName: string; email: string; plan: string; planExpiresAt: string | null; credits: number; bonusCredits: number; activePlan: string; suspended: boolean; suspendedAt: string | null;
  googleReviewUrl: string | null; sessions: number; openTickets: number; ads: number;
};
type Msg = { ok: boolean; text: string } | null;

const field = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const btn = "shrink-0 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-40";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

function Card({ title, Icon, tone = "slate", children }: { title: string; Icon: IconType; tone?: "slate" | "rose"; children: React.ReactNode }) {
  return (
    <section className={`rounded-xl border bg-white p-5 shadow-sm ${tone === "rose" ? "border-rose-200" : "border-slate-200"}`}>
      <h3 className={`flex items-center gap-2 font-bold ${tone === "rose" ? "text-rose-700" : "text-slate-900"}`}><Icon className="size-3.5" /> {title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={`flex items-center gap-1.5 text-xs font-semibold ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>
      {msg.ok ? <FaCheck /> : <FaCircleExclamation />} {msg.text}
    </p>
  );
}

// Right-hand column of the business profile: every admin action for this account
export default function BusinessManage({ business: b }: { business: Business }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msgs, setMsgs] = useState<Record<string, Msg>>({});
  const [plan, setPlan] = useState(b.plan);
  const [months, setMonths] = useState("1");
  const [credits, setCredits] = useState("");
  const [email, setEmail] = useState(b.email);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  // run an action, show its result in that card, refresh the page data on success
  const run = (key: string, fn: () => Promise<{ error?: string }>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setMsgs((m) => ({ ...m, [key]: res.error ? { ok: false, text: res.error } : { ok: true, text: ok } }));
      if (!res.error) { after?.(); router.refresh(); }
    });

  return (
    <div className="space-y-6">
      <Card title="Subscription" Icon={FaCrown}>
        {(() => {
          const now = Date.now();
          const expires = b.planExpiresAt ? Date.parse(b.planExpiresAt) : null;
          const expired = b.plan !== "free" && expires !== null && expires < now;
          const daysLeft = expires ? Math.ceil((expires - now) / 864e5) : 0;
          const m = Math.trunc(Number(months));
          // same preview rule as the server: extend an active plan of the same kind, otherwise start today
          const base = plan === b.plan && expires && expires > now ? new Date(expires) : new Date(now);
          const newEnd = plan !== "free" && m >= 1 ? addMonths(base, m) : null;
          const fmt = (d: Date | number) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          const extending = plan === b.plan && !expired && b.plan !== "free";
          return (
            <>
              {/* current state */}
              <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${expired ? "bg-rose-50 text-rose-700" : b.plan === "free" ? "bg-slate-50 text-slate-600" : "bg-emerald-50 text-emerald-800"}`}>
                <FaCalendarCheck className="shrink-0" />
                <span>
                  {b.plan === "free" ? "On the Free plan (no end date)"
                    : expired ? `${plans.find((p) => p.id === b.plan)?.name} expired on ${fmt(expires!)} · now Free`
                    : expires ? <><b>{plans.find((p) => p.id === b.plan)?.name}</b> until {fmt(expires)} · {daysLeft} day{daysLeft === 1 ? "" : "s"} left</>
                    : <><b>{plans.find((p) => p.id === b.plan)?.name}</b> · no end date set</>}
                </span>
              </div>

              <div>
                <span className={label}>Plan</span>
                <div role="radiogroup" aria-label="Plan" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {plans.map((p) => (
                    <button key={p.id} type="button" role="radio" aria-checked={plan === p.id} onClick={() => setPlan(p.id)}
                      className={`rounded-md py-1.5 text-sm font-semibold transition ${plan === p.id ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {plan !== "free" && (
                <div>
                  <span className={label}>{extending ? "Extend by" : "Duration"}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 3, 6, 12].map((n) => (
                      <button key={n} type="button" onClick={() => setMonths(String(n))}
                        className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${months === String(n) ? "border-blue-900 bg-blue-900 text-white" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-800"}`}>
                        {n === 12 ? "1 year" : `${n} month${n > 1 ? "s" : ""}`}
                      </button>
                    ))}
                    <label className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 pl-2 text-xs text-slate-500 focus-within:border-blue-600">
                      <input value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" aria-label="Months"
                        className="w-8 bg-transparent py-1.5 text-center font-semibold text-slate-900 outline-none" />
                      <span className="pr-2">mo</span>
                    </label>
                  </div>
                  {newEnd && <p className="mt-2 text-xs text-slate-500">New end date: <b className="text-slate-800">{fmt(newEnd)}</b></p>}
                </div>
              )}

              <button type="button" disabled={pending || (plan === "free" ? b.plan === "free" : !(m >= 1 && m <= 36))}
                onClick={() => run("plan", () => setBusinessPlan(b.id, plan, m), plan === "free" ? "Moved to Free." : extending ? `Extended by ${m} month${m > 1 ? "s" : ""}.` : `${plans.find((p) => p.id === plan)?.name} for ${m} month${m > 1 ? "s" : ""}.`)}
                className={`${btn} w-full py-2.5`}>
                {plan === "free" ? "Move to Free" : extending ? `Extend ${plans.find((p) => p.id === plan)?.name}` : `Start ${plans.find((p) => p.id === plan)?.name}`}
              </button>
              <Note msg={msgs.plan ?? null} />
            </>
          );
        })()}

        <div>
          {b.activePlan === "free" ? (
            <>
              <span className={label}>Bonus AI reviews · {b.bonusCredits} left</span>
              <p className="mb-2 rounded-md bg-blue-50 px-2.5 py-2 text-xs text-blue-900">Free plan: 5 AI reviews a month, plus any bonus you add here. Bonus reviews never expire.</p>
            </>
          ) : b.activePlan === "business" ? (
            <span className={label}>AI credits · unlimited on Business</span>
          ) : (
            <span className={label}>AI credits · {b.credits}{b.bonusCredits > 0 && ` + ${b.bonusCredits} bonus`} left</span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(b.activePlan === "free" ? [5, 20, 50] : [100, 500, 1000]).map((n) => (
              <button key={n} type="button" onClick={() => setCredits(String(n))}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-800">+{n}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={credits} onChange={(e) => setCredits(e.target.value)} inputMode="numeric" placeholder="e.g. 100 or -20" aria-label="Credits to add" className={field} />
            <button type="button" disabled={pending || !credits} className={btn} onClick={() => run("credits", () => addCredits(b.id, Number(credits)), b.activePlan === "free" ? "Bonus reviews updated." : "Credits updated.", () => setCredits(""))}>Apply</button>
          </div>
        </div>
        <Note msg={msgs.credits ?? null} />
      </Card>

      <Card title="Account" Icon={FaUserGear}>
        <div>
          <span className={label}>Login email</span>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Login email" className={field} />
            <button type="button" disabled={pending || email.trim().toLowerCase() === b.email} className={btn} onClick={() => run("email", () => changeBusinessEmail(b.id, email), "Email changed.")}>Save</button>
          </div>
          <Note msg={msgs.email ?? null} />
        </div>
        <div>
          <span className={label}>Set a new password</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" aria-label="New password" className={`${field} pr-9`} />
              <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600">
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button type="button" disabled={pending || password.length < 8} className={btn}
              onClick={() => run("password", () => resetBusinessPassword(b.id, password), "Password set. They were logged out everywhere.", () => setPassword(""))}>Set</button>
          </div>
          <Note msg={msgs.password ?? null} />
        </div>
        <button type="button" disabled={pending || !b.sessions} onClick={() => run("sessions", () => logoutEverywhere(b.id), "Logged out on every device.")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">
          <FaRightFromBracket className="size-3" /> Log out all devices ({b.sessions} active)
        </button>
        <Note msg={msgs.sessions ?? null} />
      </Card>

      <Card title="Danger zone" Icon={FaTriangleExclamation} tone="rose">
        <div>
          <p className="text-sm text-slate-600">
            {b.suspended
              ? `Suspended${b.suspendedAt ? ` since ${new Date(b.suspendedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}. They can’t log in and their review page is offline.`
              : "Suspending blocks login, logs them out everywhere and takes their review page offline."}
          </p>
          <button type="button" disabled={pending}
            onClick={() => (b.suspended || confirm(`Suspend ${b.businessName}?`)) && run("suspend", () => setSuspended(b.id, !b.suspended), b.suspended ? "Account reactivated." : "Account suspended.")}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-40 ${b.suspended ? "bg-emerald-600 text-white hover:bg-emerald-500" : "border border-rose-200 text-rose-700 hover:bg-rose-50"}`}>
            {b.suspended ? <><FaCircleCheck /> Reactivate account</> : <><FaBan /> Suspend account</>}
          </button>
          <Note msg={msgs.suspend ?? null} />
        </div>
        <div className="border-t border-rose-100 pt-4">
          <p className="text-sm text-slate-600">Delete permanently, with all responses, ads, payments and tickets. This can’t be undone.</p>
          <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={`Type “${b.businessName}” to confirm`} aria-label="Type the business name to confirm" className={`${field} mt-3`} />
          <button type="button" disabled={pending || confirmName.trim() !== b.businessName}
            onClick={() => run("delete", () => deleteBusiness(b.id, confirmName), "Deleted.", () => router.push("/admin/businesses"))}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-30">
            <FaTrashCan className="size-3" /> Delete business
          </button>
          <Note msg={msgs.delete ?? null} />
        </div>
      </Card>
    </div>
  );
}
