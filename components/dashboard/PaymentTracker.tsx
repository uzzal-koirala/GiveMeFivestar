"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaCrown, FaBolt, FaCalendarCheck, FaHourglassHalf, FaArrowRight, FaPlus } from "react-icons/fa6";
import { ApprovedCard, RejectedCard, WaitingCard, since } from "./PaymentStatusCards";
import { dismissPaymentNotice } from "@/app/actions/notices";

export type TrackedPayment = {
  id: string; kind: "plan" | "topup"; amount: number; createdAt: string;
  planName?: string; cycle?: string; reviews?: number; // what was bought
};
export type TrackerState =
  | { status: "waiting"; payment: TrackedPayment }
  | { status: "approved"; payment: TrackedPayment; credits: number | null; expiresAt: string | null }
  | { status: "rejected"; payment: TrackedPayment };

const npr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const what = (p: TrackedPayment) => (p.kind === "plan" ? <>the <b className="text-slate-800">{p.planName}</b> plan ({p.cycle})</> : <><b className="text-slate-800">{p.reviews?.toLocaleString()} AI reviews</b></>);

// Follows a plan or top-up payment bought from the dashboard: waiting -> approved (or rejected)
export default function PaymentTracker({ state, whatsapp }: { state: TrackerState; whatsapp: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(state.status !== "waiting"); // waiting opens below unless they minimised it
  const [pending, start] = useTransition();
  const { payment: p } = state;
  const key = `pay-wait-hidden-${p.id}`;

  useEffect(() => {
    if (state.status !== "waiting") return setOpen(true);
    let hidden = false;
    try { hidden = sessionStorage.getItem(key) === "1"; } catch {}
    setOpen(!hidden);
    // keep checking even while minimised
    const poll = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(poll);
  }, [state.status, key, router]);

  const minimise = () => { try { sessionStorage.setItem(key, "1"); } catch {} setOpen(false); };
  const finish = (to?: string) => start(async () => { await dismissPaymentNotice("payment", p.id); if (to) location.href = to; else router.refresh(); });

  if (!open) {
    return state.status === "waiting" ? (
      <button type="button" onClick={() => setOpen(true)}
        className="notice-in fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full bg-blue-950 py-2.5 pl-2.5 pr-5 text-left text-white shadow-2xl shadow-blue-950/30 ring-1 ring-white/10 transition hover:-translate-y-0.5">
        <span className="relative grid size-9 place-items-center rounded-full bg-amber-300 text-blue-950">
          <span className="wait-ring absolute inset-0 rounded-full bg-amber-300/50" />
          <FaHourglassHalf className="wait-flip relative size-3.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold">Verifying your payment</span>
          <span className="block text-xs text-blue-200">Sent {since(p.createdAt)} · tap to view</span>
        </span>
      </button>
    ) : null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Payment status" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center py-6">
        <div className="tab-fade w-full">
          {state.status === "waiting" && (
            <WaitingCard sentAt={p.createdAt} whatsapp={whatsapp} onClose={minimise} closeHint="Checking automatically, you can keep working"
              done={p.kind === "plan" ? { Icon: FaCrown, title: `${p.planName} plan activated` } : { Icon: FaBolt, title: `${p.reviews?.toLocaleString()} AI reviews added` }}
              message={<>We received {npr(p.amount)} for {what(p)}. You can close this and keep using your dashboard while we check it.</>} />
          )}

          {state.status === "approved" && (
            <ApprovedCard
              onClose={() => finish()}
              heading={p.kind === "plan" ? `You're on ${p.planName} now!` : "Your AI reviews are ready!"}
              text={p.kind === "plan"
                ? <>Your <b className="text-slate-800">{p.planName}</b> plan is active{state.expiresAt ? <> until <b className="text-slate-800">{fmtDate(state.expiresAt)}</b></> : null}. Enjoy the extra reviews.</>
                : <><b className="text-slate-800">{p.reviews?.toLocaleString()} AI reviews</b> were added to your account.</>}
              stats={p.kind === "plan"
                ? [
                    { Icon: FaCrown, label: "Plan", value: p.planName ?? "" },
                    { Icon: FaBolt, label: "AI reviews", value: state.credits === null ? "Unlimited" : state.credits.toLocaleString() },
                    { Icon: FaCalendarCheck, label: "Active until", value: state.expiresAt ? fmtDate(state.expiresAt) : "No end date" },
                  ]
                : [
                    { Icon: FaPlus, label: "Added", value: (p.reviews ?? 0).toLocaleString() },
                    { Icon: FaBolt, label: "AI reviews left", value: (state.credits ?? 0).toLocaleString() },
                  ]}
              action={
                <button type="button" disabled={pending} onClick={() => finish()}
                  className="mx-auto mt-8 flex items-center gap-2 rounded-lg bg-blue-900 px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60">
                  {pending ? "One moment…" : "Continue"} <FaArrowRight className="size-3.5" />
                </button>
              }
            />
          )}

          {state.status === "rejected" && (
            <RejectedCard whatsapp={whatsapp}
              text={<>Your payment of {npr(p.amount)} for {what(p)} couldn&apos;t be verified. Please check the amount and transaction ID, then try again.</>}
              action={
                <button type="button" disabled={pending} onClick={() => finish(`/dashboard/settings?tab=${p.kind === "plan" ? "subscription" : "ai"}`)}
                  className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">
                  Try again <FaArrowRight className="size-3" />
                </button>
              } />
          )}
        </div>
      </div>
    </div>
  );
}
