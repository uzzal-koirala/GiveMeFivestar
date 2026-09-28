"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MdQrCode2 } from "react-icons/md";
import {
  FaCheck, FaCrown, FaArrowRight, FaWhatsapp,
  FaRightFromBracket, FaTriangleExclamation, FaStore, FaGift, FaBolt, FaCalendarCheck,
} from "react-icons/fa6";
import { ApprovedCard, WaitingCard } from "./PaymentStatusCards";
import ManualPaymentDialog, { paymentForm, type ManualPayment } from "./ManualPaymentDialog";
import { requestPayment } from "@/app/actions/settings";
import { chooseFreePlan, finishPlanStep } from "@/app/actions/plan";
import { logout } from "@/app/actions/auth";
import { plans, planOf, YEARLY_MONTHS } from "@/lib/site";
import { npr } from "@/components/ui/PaymentMethods";
import type { PaymentMethod } from "@/lib/platform";

export type PlanGateState =
  | { step: "pick"; rejected?: { plan: string } }
  | { step: "waiting"; payment: { plan: string; cycle: string; amount: number; method: string; createdAt: string } }
  | { step: "approved"; plan: string; expiresAt: string | null; credits: number };

type Cycle = "monthly" | "yearly";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// Journey shown at the top of every screen
const JOURNEY = ["Choose plan", "Pay", "Approval", "Set up business"];
function Journey({ at }: { at: number }) {
  return (
    <ol className="mx-auto flex max-w-xl items-center gap-2 text-xs font-semibold">
      {JOURNEY.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={`grid size-7 shrink-0 place-items-center rounded-full ${i < at ? "bg-emerald-400 text-blue-950" : i === at ? "bg-amber-300 text-blue-950 ring-4 ring-amber-300/25" : "bg-white/10 text-blue-200"}`}>
            {i < at ? <FaCheck className="size-3" /> : i + 1}
          </span>
          <span className={`hidden whitespace-nowrap sm:inline ${i <= at ? "text-white" : "text-blue-200/70"}`}>{label}</span>
          {i < JOURNEY.length - 1 && <span className={`h-px flex-1 ${i < at ? "bg-emerald-400/60" : "bg-white/15"}`} />}
        </li>
      ))}
    </ol>
  );
}

function Shell({ at, children, name, hero }: { at: number; children: React.ReactNode; name: string; hero?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-950 pb-40 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <span className="flex items-center gap-2 font-extrabold tracking-[0.15em]"><MdQrCode2 className="size-7 text-amber-300" /> <span className="hidden sm:inline">GIVE ME FIVE STAR</span></span>
          <form action={logout}>
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">
              <span className="hidden sm:inline">{name} ·</span> Log out <FaRightFromBracket className="size-3.5" />
            </button>
          </form>
        </div>
        <div className="px-4 pt-6"><Journey at={at} /></div>
        {hero && <div className="px-4 pt-10">{hero}</div>}
      </div>
      <div className="mx-auto -mt-32 max-w-6xl px-4 pb-16 sm:px-6">{children}</div>
    </div>
  );
}

// ---------- 1. choose a plan ----------
function PickPlan({ state, methods, name }: { state: Extract<PlanGateState, { step: "pick" }>; methods: PaymentMethod[]; name: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [chosen, setChosen] = useState(plans[1]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const total = (price: number) => (cycle === "yearly" ? price * YEARLY_MONTHS : price);

  const pick = (p: (typeof plans)[number]) => {
    setError("");
    if (!p.price) return start(async () => { const r = await chooseFreePlan(); if (r.error) setError(r.error); else router.refresh(); });
    setChosen(p);
    dialog.current?.showModal();
  };
  const submit = (pay: ManualPayment) =>
    start(async () => {
      const r = await requestPayment(paymentForm({ kind: "plan", item: `${chosen.id}:${cycle}` }, pay));
      if (r.error) return setError(r.error);
      router.refresh(); // server now shows the waiting screen
    });

  return (
    <Shell at={0} name={name} hero={
      <div className="text-center text-white">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome, {name.split(" ")[0]}! Choose your plan</h1>
        <p className="mx-auto mt-3 max-w-lg text-blue-100/90">Pick how many reviews you want each month. You can change it any time.</p>
        <div role="radiogroup" aria-label="Billing" className="mt-6 inline-flex items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/15">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${cycle === c ? "bg-white text-blue-950 shadow" : "text-blue-100 hover:text-white"}`}>
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "yearly" && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-blue-950">2 months free</span>}
            </button>
          ))}
        </div>
      </div>
    }>
      {state.rejected && (
        <p role="alert" className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-800 ring-1 ring-rose-200">
          <FaTriangleExclamation className="mt-0.5 shrink-0" />
          <span>We couldn&apos;t verify your payment for the <b>{planOf(state.rejected.plan).name}</b> plan. Please check the amount and try again, or contact us on WhatsApp.</span>
        </p>
      )}
      {error && <p role="alert" className="mx-auto mt-6 max-w-2xl rounded-xl bg-rose-50 px-5 py-3 text-center text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => {
          const featured = !!p.popular;
          const monthly = cycle === "yearly" ? Math.round((p.price * YEARLY_MONTHS) / 12) : p.price;
          return (
            <article key={p.id} className={`relative flex flex-col rounded-xl p-7 ${featured ? "bg-blue-900 text-white shadow-xl shadow-blue-950/30 ring-2 ring-amber-300" : "border border-slate-200 bg-white text-slate-900 shadow-sm"}`}>
              {featured && <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-amber-300 px-3.5 py-1 text-xs font-bold text-blue-950 shadow"><FaCrown className="size-3" /> Most popular</span>}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight">{p.price ? npr(monthly) : "Free"}</span>
                {p.price > 0 && <span className={`pb-1.5 text-sm ${featured ? "text-blue-200" : "text-slate-500"}`}>/ month</span>}
              </div>
              <p className={`mt-1 h-5 text-xs ${featured ? "text-blue-200" : "text-slate-400"}`}>{!p.price ? "No payment needed" : cycle === "yearly" ? `${npr(total(p.price))} paid once for the year` : "Paid monthly"}</p>
              <ul className={`mt-6 flex-1 space-y-2.5 border-t pt-6 text-sm ${featured ? "border-white/15" : "border-slate-100"}`}>
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${featured ? "bg-amber-300 text-blue-950" : "bg-emerald-50 text-emerald-600"}`}><FaCheck className="size-2.5" /></span>
                    <span className={featured ? "text-blue-50" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
              </ul>
              <button type="button" disabled={pending} onClick={() => pick(p)}
                className={`mt-7 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition disabled:opacity-60 ${featured ? "bg-amber-300 text-blue-950 hover:bg-amber-200" : "bg-blue-900 text-white hover:bg-blue-800"}`}>
                {p.price ? <>Choose {p.name} <FaArrowRight className="size-3" /></> : <>Start with Free <FaArrowRight className="size-3" /></>}
              </button>
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">Paid plans are activated after we verify your payment, usually within a few hours. Payments are non-refundable.</p>

      <ManualPaymentDialog ref={dialog} amount={total(chosen.price)} title={`${chosen.name} plan · ${cycle === "yearly" ? "Yearly" : "Monthly"}`} methods={methods} onSubmit={submit} />
    </Shell>
  );
}

// ---------- 2. waiting for approval ----------
function Waiting({ state, name, whatsapp }: { state: Extract<PlanGateState, { step: "waiting" }>; name: string; whatsapp: string }) {
  const plan = planOf(state.payment.plan);
  return (
    <Shell at={2} name={name}>
      <WaitingCard sentAt={state.payment.createdAt} whatsapp={whatsapp} done={{ Icon: FaCrown, title: `${plan.name} plan activated` }}
        message={<>We received {npr(state.payment.amount)} for the <b className="text-slate-800">{plan.name}</b> plan ({state.payment.cycle}). Your dashboard opens as soon as it&apos;s approved.</>} />
    </Shell>
  );
}

// ---------- 3. approved ----------
function Approved({ state, name }: { state: Extract<PlanGateState, { step: "approved" }>; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const plan = planOf(state.plan);
  return (
    <Shell at={3} name={name}>
      <ApprovedCard
        heading={`Congratulations, ${name.split(" ")[0]}!`}
        text={<>Your <b className="text-slate-800">{plan.name}</b> plan is now active. Let&apos;s set up your business so customers can start leaving reviews.</>}
        stats={[
          { Icon: FaCrown, label: "Plan", value: plan.name },
          { Icon: FaBolt, label: "AI reviews", value: plan.reviews === null ? "Unlimited" : state.credits.toLocaleString() },
          { Icon: FaCalendarCheck, label: "Active until", value: state.expiresAt ? fmtDate(state.expiresAt) : "No end date" },
        ]}
        action={<>
          {error && <p role="alert" className="mt-5 text-sm font-medium text-rose-600">{error}</p>}
          <button type="button" disabled={pending}
            onClick={() => start(async () => { const r = await finishPlanStep(); if (r.error) setError(r.error); else router.refresh(); })}
            className="mx-auto mt-8 flex items-center gap-2 rounded-lg bg-blue-900 px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60">
            <FaStore className="size-4" /> {pending ? "Opening…" : "Continue to set up my business"} <FaArrowRight className="size-3.5" />
          </button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><FaGift className="size-3" /> Takes about 2 minutes</p>
        </>}
      />
    </Shell>
  );
}

export default function PlanGate({ state, methods, name, whatsapp }: { state: PlanGateState; methods: PaymentMethod[]; name: string; whatsapp: string }) {
  if (state.step === "waiting") return <Waiting state={state} name={name} whatsapp={whatsapp} />;
  if (state.step === "approved") return <Approved state={state} name={name} />;
  return <PickPlan state={state} methods={methods} name={name} />;
}
