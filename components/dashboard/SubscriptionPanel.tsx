"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FaCrown, FaCheck, FaReceipt, FaCircleCheck, FaArrowUp, FaClock, FaTriangleExclamation } from "react-icons/fa6";
import { npr } from "@/components/ui/PaymentMethods";
import ManualPaymentDialog, { paymentForm, type ManualPayment } from "./ManualPaymentDialog";
import { requestPayment } from "@/app/actions/settings";
import { aiReviewsLeft, creditPacks, nextMonthStart, plans, YEARLY_MONTHS } from "@/lib/site";
import type { PaymentRequestView } from "@/lib/types";
import type { PaymentMethod } from "@/lib/platform";

type Cycle = "monthly" | "yearly";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const total = (price: number, cycle: Cycle) => (cycle === "yearly" ? price * YEARLY_MONTHS : price);
const perMonth = (price: number, cycle: Cycle) => (cycle === "yearly" ? Math.round((price * YEARLY_MONTHS) / 12) : price);
const STATUS: Record<string, string> = { submitted: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-rose-50 text-rose-700" };
const STATUS_LABEL: Record<string, string> = { submitted: "Verifying", approved: "Approved", rejected: "Rejected" };

// what a payment was for, in words
function describe(p: PaymentRequestView) {
  if (p.kind === "topup") return `${creditPacks.find((c) => c.id === p.item)?.reviews.toLocaleString() ?? ""} AI reviews`;
  const [id, cycle] = p.item.split(":");
  return `${plans.find((x) => x.id === id)?.name ?? id} plan · ${cycle === "yearly" ? "Yearly" : "Monthly"}`;
}

// Plan overview and upgrade requests (paid manually; the super admin switches the plan after verifying)
export default function SubscriptionPanel({ plan, expiresAt, payments: initial, methods, credits, bonus = 0, usedThisMonth }: { plan: string; expiresAt: string | null; payments: PaymentRequestView[]; methods: PaymentMethod[]; credits: number; bonus?: number; usedThisMonth: number }) {
    const router = useRouter();
const [payments, setPayments] = useState(initial);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [target, setTarget] = useState(plans[1]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const current = plans.find((p) => p.id === plan) ?? plans[0];
  const currentIdx = plans.indexOf(current);
  const pendingUpgrade = payments.find((p) => p.kind === "plan" && p.status === "submitted");

  async function submit(p: ManualPayment) {
    const res = await requestPayment(paymentForm({ kind: "plan", item: `${target.id}:${cycle}` }, p));
    if (res.error || !res.payment) return setMsg({ ok: false, text: res.error ?? "Couldn’t send your payment. Please try again." });
    setPayments([res.payment, ...payments]);
    router.refresh(); // the dashboard now shows the "waiting for approval" popup
    setMsg({ ok: true, text: `Payment proof sent. You’ll be moved to ${target.name} once we verify it, usually within a few hours.` });
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <section className="rounded-3xl bg-blue-950 p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-amber-300 text-blue-950"><FaCrown className="size-6" /></span>
            <div>
              <p className="text-sm text-blue-200">Current plan</p>
              <p className="text-2xl font-bold">{current.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-blue-200">Price</p>
              <p className="mt-0.5 font-semibold">{current.price ? `${npr(current.price)} / month` : "Free"}</p>
            </div>
            <div>
              <p className="text-blue-200">AI reviews</p>
              <p className="mt-0.5 font-semibold">{current.reviews === null ? "Unlimited" : `${current.reviews.toLocaleString()} / month`}</p>
            </div>
            {expiresAt && current.price > 0 && (
              <div>
                <p className="text-blue-200">Active until</p>
                <p className="mt-0.5 font-semibold">
                  {fmtDate(expiresAt)} · {Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 864e5))} days left
                </p>
              </div>
            )}
          </div>
        </div>

        {/* this month's usage */}
        {(() => {
          const left = aiReviewsLeft(plan, credits, usedThisMonth, bonus);
          const cap = current.reviews;
          const used = cap === null ? usedThisMonth : plan === "free" ? Math.min(usedThisMonth, cap) : usedThisMonth;
          const pct = cap === null ? 100 : plan === "free" ? Math.round((used / cap) * 100) : Math.min(100, Math.round((used / Math.max(1, used + (left ?? 0))) * 100));
          const full = left === 0;
          return (
            <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex flex-wrap items-end justify-between gap-2 text-sm">
                <span className="text-blue-200">AI reviews this month</span>
                <span className="font-semibold">
                  {cap === null ? <>{used.toLocaleString()} written · <span className="text-amber-300">Unlimited</span></>
                    : plan === "free" ? <>{used} of {cap} used · <span className={full ? "text-rose-300" : "text-amber-300"}>{left} left</span>{bonus > 0 && <span className="text-emerald-300"> (incl. {bonus} bonus)</span>}</>
                    : <>{used.toLocaleString()} used · <span className={full ? "text-rose-300" : "text-amber-300"}>{(left ?? 0).toLocaleString()} credits left</span></>}
                </span>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full transition-all ${cap === null ? "bg-emerald-400" : full ? "bg-rose-400" : pct >= 80 ? "bg-amber-300" : "bg-emerald-400"}`} style={{ width: `${cap === null ? 100 : Math.max(pct, used ? 4 : 0)}%` }} />
              </div>
              {plan === "free" && (
                <p className="mt-2 text-xs text-blue-200">
                  {full ? "You've used all of this month's AI reviews. Your review page is paused until the 1st, or upgrade below." : `Starts again on ${nextMonthStart().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`}
                </p>
              )}
            </div>
          );
        })()}
      </section>

      {pendingUpgrade && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <FaClock className="shrink-0" /> Upgrade to {describe(pendingUpgrade)} is waiting for payment verification.
        </p>
      )}
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`tab-fade flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {msg.ok ? <FaCircleCheck className="shrink-0" /> : <FaTriangleExclamation className="shrink-0" />} {msg.text}
        </p>
      )}

      {/* Plans */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Choose your plan</h2>
            <p className="mt-1 text-sm text-slate-500">Upgrade anytime. Your reviews and customers stay safe.</p>
          </div>
          <div role="radiogroup" aria-label="Billing period" className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            {(["monthly", "yearly"] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${cycle === c ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {c === "monthly" ? "Monthly" : "Yearly"}
                {c === "yearly" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">2 months free</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <div key={p.id} className={`relative flex flex-col rounded-2xl border-2 p-6 ${p.popular ? "border-blue-900 shadow-lg shadow-blue-900/10" : "border-slate-200"}`}>
              {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-amber-300 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-950">Most popular</span>}
              <p className="font-bold text-slate-900">{p.name}</p>
              <p className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">{p.price ? npr(perMonth(p.price, cycle)) : "Rs 0"}</span>
                <span className="text-sm text-slate-500"> / month</span>
              </p>
              <p className="mt-1 h-4 text-xs text-slate-400">{p.price && cycle === "yearly" ? `${npr(total(p.price, "yearly"))} billed yearly` : ""}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm text-slate-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"><FaCheck className="size-2.5" /></span>
                    {f}
                  </li>
                ))}
              </ul>
              {p.id === current.id ? (
                <span className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-500"><FaCircleCheck /> Current plan</span>
              ) : i > currentIdx ? (
                <button type="button" disabled={!!pendingUpgrade} onClick={() => { setTarget(p); dialog.current?.showModal(); }}
                  className={`mt-6 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${p.popular ? "bg-blue-900 text-white hover:bg-blue-800" : "border border-slate-200 text-slate-800 hover:bg-slate-50"}`}>
                  <FaArrowUp className="size-3" /> Upgrade to {p.name}
                </button>
              ) : (
                // downgrades go through support so nothing is cut off by mistake
                <a href="/dashboard/support?new=downgrade" className="mt-6 py-3 text-center text-xs font-semibold text-slate-500 hover:text-blue-700 hover:underline">Contact support to downgrade</a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Billing history: every plan / top-up payment you've sent */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FaReceipt className="text-blue-700" /> Billing history</h2>
        {payments.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400">
                <tr>{["Date", "For", "Paid with", "Amount", "Status"].map((h) => <th key={h} className="whitespace-nowrap py-2 pr-6 font-semibold last:pr-0">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap py-3 pr-6 text-slate-600">{fmtDate(p.createdAt)}</td>
                    <td className="whitespace-nowrap py-3 pr-6 font-medium text-slate-900">{describe(p)}</td>
                    <td className="whitespace-nowrap py-3 pr-6 text-slate-600">{methods.find((m) => m.id === p.method)?.label ?? p.method}</td>
                    <td className="whitespace-nowrap py-3 pr-6 font-semibold text-slate-900">{npr(p.amount)}</td>
                    <td className="whitespace-nowrap py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[p.status] ?? "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[p.status] ?? p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">No payments yet. They’ll show up here after your first upgrade or top-up.</p>
        )}
      </section>

      <ManualPaymentDialog ref={dialog} amount={total(target.price, cycle)} title={`${target.name} plan · ${cycle === "yearly" ? "Yearly" : "Monthly"}`} methods={methods} onSubmit={submit} />
    </div>
  );
}
