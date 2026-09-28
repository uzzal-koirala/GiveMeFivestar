"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaCheck, FaCrown, FaArrowRight } from "react-icons/fa6";
import AuthButton from "@/components/auth/AuthButton";
import { plans, YEARLY_MONTHS } from "@/lib/site";
import { npr } from "@/components/ui/PaymentMethods";

type Cycle = "monthly" | "yearly";
const TAGLINE: Record<string, string> = {
  free: "Try it at one counter and see the reviews come in.",
  pro: "For busy shops that want steady 5-star reviews.",
  business: "For high-volume and multi-staff businesses.",
};

// Monthly / yearly switch and the three plan cards
export default function PlanCards({ dashboardHref }: { dashboardHref: string | null }) {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const row = useRef<HTMLDivElement>(null);

  // phones show the plans as a swipeable row: start on the most popular one
  useEffect(() => {
    const el = row.current;
    const pick = el?.querySelector<HTMLElement>("[data-featured]");
    if (el && pick && el.scrollWidth > el.clientWidth) el.scrollLeft = pick.offsetLeft - (el.clientWidth - pick.offsetWidth) / 2;
  }, []);

  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Billing" className="inline-flex items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/15">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${cycle === c ? "bg-white text-blue-950 shadow" : "text-blue-100 hover:text-white"}`}>
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "yearly" && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-blue-950">2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      <div ref={row} className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-4 pt-5 sm:mt-12 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0">
        {plans.map((p) => {
          const featured = !!p.popular;
          const monthly = cycle === "yearly" ? Math.round((p.price * YEARLY_MONTHS) / 12) : p.price;
          const cta = p.price ? `Get ${p.name}` : "Start free";
          const btn = `mt-8 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition ${featured ? "bg-amber-300 text-blue-950 hover:bg-amber-200" : "bg-blue-900 text-white hover:bg-blue-800"}`;
          return (
            <article key={p.id} data-featured={featured || undefined}
              className={`relative flex w-[86%] shrink-0 snap-center flex-col rounded-xl p-6 shadow-sm sm:w-[60%] sm:p-7 lg:w-auto ${featured ? "bg-blue-900 text-white shadow-xl shadow-blue-950/30 ring-2 ring-amber-300 lg:-my-4 lg:py-11" : "border border-slate-200 bg-white text-slate-900"}`}>
              {featured && (
                <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-amber-300 px-3.5 py-1 text-xs font-bold text-blue-950 shadow">
                  <FaCrown className="size-3" /> Most popular
                </span>
              )}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className={`mt-1 min-h-10 text-sm ${featured ? "text-blue-100" : "text-slate-500"}`}>{TAGLINE[p.id]}</p>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight">{p.price ? npr(monthly) : "Free"}</span>
                {p.price > 0 && <span className={`pb-1.5 text-sm ${featured ? "text-blue-200" : "text-slate-500"}`}>/ month</span>}
              </div>
              <p className={`mt-1 h-5 text-xs ${featured ? "text-blue-200" : "text-slate-400"}`}>
                {!p.price ? "Forever. No card needed." : cycle === "yearly" ? `${npr(p.price * YEARLY_MONTHS)} billed yearly · save ${npr(p.price * (12 - YEARLY_MONTHS))}` : "Billed monthly · cancel anytime"}
              </p>

              {dashboardHref ? (
                <Link href={dashboardHref} className={btn}>{p.price ? `Upgrade to ${p.name}` : "Go to dashboard"} <FaArrowRight className="size-3" /></Link>
              ) : (
                <AuthButton className={btn}>{cta} <FaArrowRight className="size-3" /></AuthButton>
              )}

              <ul className={`mt-8 space-y-3 border-t pt-7 text-sm ${featured ? "border-white/15" : "border-slate-100"}`}>
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${featured ? "bg-amber-300 text-blue-950" : "bg-emerald-50 text-emerald-600"}`}><FaCheck className="size-2.5" /></span>
                    <span className={featured ? "text-blue-50" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500 lg:hidden">Swipe to compare plans</p>
    </div>
  );
}
