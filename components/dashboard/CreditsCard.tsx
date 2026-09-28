"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FaBolt, FaTriangleExclamation, FaClock, FaCircleCheck } from "react-icons/fa6";
import { npr } from "@/components/ui/PaymentMethods";
import ManualPaymentDialog, { paymentForm, type ManualPayment } from "./ManualPaymentDialog";
import { requestPayment } from "@/app/actions/settings";
import { aiReviewsLeft, creditPacks, nextMonthStart, planOf } from "@/lib/site";
import type { PaymentRequestView } from "@/lib/types";
import type { PaymentMethod } from "@/lib/platform";

// Real AI review balance + top-up requests (paid manually, credits added after the super admin approves)
export default function CreditsCard({ credits, bonus = 0, plan, usedThisMonth, payments, methods }: {
  credits: number;
  bonus?: number;
  plan: string;
  usedThisMonth: number;
  payments: PaymentRequestView[];
  methods: PaymentMethod[];
}) {
    const router = useRouter();
const [pack, setPack] = useState(creditPacks[0]);
  const [pending, setPending] = useState(payments.filter((p) => p.kind === "topup" && p.status === "submitted"));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const allowance = planOf(plan).reviews;
  const unlimited = allowance === null;
  const isFree = plan === "free";
  const left = aiReviewsLeft(plan, credits, usedThisMonth, bonus) ?? 0;
  const resets = nextMonthStart().toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const pct = unlimited ? 100 : Math.min(100, Math.round((left / allowance) * 100));
  const low = !unlimited && pct <= 25;

  function choose(p: (typeof creditPacks)[number]) {
    setPack(p);
    dialog.current?.showModal();
  }

  async function submit(p: ManualPayment) {
    const res = await requestPayment(paymentForm({ kind: "topup", item: pack.id }, p));
    if (res.error || !res.payment) return setMsg({ ok: false, text: res.error ?? "Couldn’t send your payment. Please try again." });
    setPending([res.payment, ...pending]);
    router.refresh(); // the dashboard now shows the "waiting for approval" popup
    setMsg({ ok: true, text: `Payment proof sent for ${pack.reviews.toLocaleString()} reviews. They’re added once we verify it, usually within a few hours.` });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative size-24 shrink-0">
          <svg viewBox="0 0 36 36" className="size-24 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" className="stroke-slate-100" />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round" pathLength="100"
              strokeDasharray={`${pct} 100`} className={low ? "stroke-amber-400" : "stroke-blue-700"} />
          </svg>
          <span className="absolute inset-0 grid place-items-center"><FaBolt className={`size-6 ${low ? "text-amber-500" : "text-blue-800"}`} /></span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500">{isFree ? "AI reviews left this month" : "AI reviews left"}</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">{unlimited ? "Unlimited" : isFree && !bonus ? <>{left} <span className="text-xl text-slate-400">/ {allowance}</span></> : left.toLocaleString()}</p>
          {bonus > 0 && !unlimited && <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Includes {bonus.toLocaleString()} bonus reviews from Give Me Five Star</p>}
          <p className="mt-1 text-xs text-slate-500">{isFree ? `${Math.min(usedThisMonth, allowance!)} of ${allowance} used this month · starts again on ${resets}` : `${usedThisMonth.toLocaleString()} used this month · each AI-written review uses 1`}</p>
        </div>
      </div>

      {low && (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <FaTriangleExclamation className="shrink-0" /> Running low. When it reaches 0, customers can’t generate reviews.
        </p>
      )}

      {isFree ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-blue-50 px-5 py-4 ring-1 ring-blue-100">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">The Free plan includes {allowance} AI reviews a month</p>
            <p className="text-sm text-slate-600">Need more? Pro gives you 100 a month, and Business is unlimited.</p>
          </div>
          <a href="/dashboard/settings?tab=subscription" className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">See plans</a>
        </div>
      ) : unlimited ? (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <FaCircleCheck className="shrink-0" /> Your Business plan includes unlimited AI reviews. No top-ups needed.
        </p>
      ) : (<>
      <p className="mt-6 text-sm font-semibold text-slate-800">Top up</p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        {creditPacks.map((p) => (
          <button key={p.id} type="button" onClick={() => choose(p)}
            className={`relative rounded-2xl border-2 p-3 text-left transition sm:p-4 hover:-translate-y-0.5 ${p.popular ? "border-blue-900" : "border-slate-200 hover:border-slate-300"}`}>
            {p.popular && <span className="absolute -top-2.5 right-3 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-950">Popular</span>}
            <p className="font-bold text-slate-900">{p.reviews.toLocaleString()} reviews</p>
            <p className="mt-1 text-lg font-extrabold text-blue-900">{npr(p.price)}</p>
            <p className="text-xs text-slate-500">{npr(+(p.price / p.reviews).toFixed(2))} per review</p>
          </button>
        ))}
      </div>
      </>)}

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`tab-fade mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {msg.ok ? <FaCircleCheck className="shrink-0" /> : <FaTriangleExclamation className="shrink-0" />} {msg.text}
        </p>
      )}
      {pending.length > 0 && (
        <ul className="mt-4 space-y-2">
          {pending.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <FaClock className="text-amber-500" /> {creditPacks.find((c) => c.id === p.item)?.reviews.toLocaleString()} reviews · {npr(p.amount)}
              </span>
              <span className="text-xs font-semibold text-amber-700">Verifying payment</span>
            </li>
          ))}
        </ul>
      )}

      <ManualPaymentDialog ref={dialog} amount={pack.price} title={`${pack.reviews.toLocaleString()} AI reviews`} methods={methods} onSubmit={submit} />
    </section>
  );
}
