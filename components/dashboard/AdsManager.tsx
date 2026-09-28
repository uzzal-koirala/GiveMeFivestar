"use client";

import { useRef, useState } from "react";
import {
  FaBullhorn, FaClock, FaCirclePlay, FaCircleCheck, FaStar, FaWallet, FaArrowRight, FaReceipt, FaCircleInfo, FaCalendarCheck, FaMinus, FaPlus, FaTriangleExclamation,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import { npr } from "@/components/ui/PaymentMethods";
import ManualPaymentDialog, { paymentForm, type ManualPayment } from "./ManualPaymentDialog";
import { requestAd } from "@/app/actions/ads";
import type { PaymentMethod } from "@/lib/platform";
import type { Ad, AdStatus } from "@/lib/types";

const QUICK = [25, 50, 100, 250];
const STEP = 5;
const STATUS: Record<AdStatus, { label: string; Icon: IconType; cls: string; bar: string }> = {
  pending: { label: "Pending approval", Icon: FaClock, cls: "bg-amber-50 text-amber-800", bar: "bg-amber-400" },
  running: { label: "Running", Icon: FaCirclePlay, cls: "bg-blue-50 text-blue-800", bar: "bg-blue-600" },
  completed: { label: "Completed", Icon: FaCircleCheck, cls: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  rejected: { label: "Payment rejected", Icon: FaTriangleExclamation, cls: "bg-rose-50 text-rose-700", bar: "bg-rose-400" },
};
const FILTERS = ["all", "pending", "running", "completed"] as const;

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const card = "rounded-xl border border-slate-200 bg-white shadow-sm";

export default function AdsManager({ initial, price, methods, min, max }: { initial: Ad[]; price: number; methods: PaymentMethod[]; min: number; max: number }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const [ads, setAds] = useState(initial);
  const [reviews, setReviews] = useState(() => Math.min(max, Math.max(min, 50)));
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [sent, setSent] = useState("");
  const [failed, setFailed] = useState("");

  const valid = reviews >= min && reviews <= max;
  const total = reviews * price;
  const shown = filter === "all" ? ads : ads.filter((a) => a.status === filter);
  const delivered = ads.reduce((n, a) => n + a.delivered, 0);
  const spent = ads.reduce((n, a) => n + a.delivered * a.pricePerReview, 0);

  const payDialog = useRef<HTMLDialogElement>(null);

  function request(e: React.FormEvent) {
    e.preventDefault();
    if (valid) payDialog.current?.showModal();
  }

  // TODO: upload the proof + POST to the API; the super admin verifies payment, approves and starts the campaign
  // saves the request + payment proof; the super admin verifies it and starts the ad
  async function submitPayment(p: ManualPayment) {
    const res = await requestAd(paymentForm({ reviews: String(reviews), notes: notes.trim() }, p));
    if (res.error || !res.ad) return setFailed(res.error ?? "Couldn’t send your request. Please try again.");
    setFailed("");
    setAds([res.ad, ...ads]);
    setNotes("");
    setFilter("all");
    setSent(`${res.ad.id} submitted with your payment proof. We’ll verify it within a few hours and then start your ad.`);
    setTimeout(() => setSent(""), 6000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ads</h1>
        <p className="mt-1 text-blue-200">Get more reviews faster. You only pay for reviews delivered.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total ads", value: ads.length, Icon: FaBullhorn, tint: "bg-blue-100 text-blue-800" },
          { label: "Reviews delivered", value: delivered.toLocaleString(), Icon: FaStar, tint: "bg-amber-100 text-amber-700" },
          { label: "Total spent", value: npr(spent), Icon: FaWallet, tint: "bg-emerald-100 text-emerald-700" },
          { label: "Active ads", value: ads.filter((a) => a.status !== "completed").length, Icon: FaCirclePlay, tint: "bg-violet-100 text-violet-700" },
        ].map(({ label, value, Icon, tint }) => (
          <div key={label} className={`${card} flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5`}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-lg sm:size-12 ${tint}`}><Icon className="size-4 sm:size-5" /></span>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Request */}
      <form onSubmit={request} className={`${card} grid overflow-hidden lg:grid-cols-[1fr_340px]`}>
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Request an ad</h2>
            <p className="mt-1 text-sm text-slate-500">Tell us how many reviews you want. Our team sets it up after approval.</p>
          </div>

          <p role="note" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <FaTriangleExclamation className="mt-0.5 shrink-0 text-amber-500" />
            <span><b className="font-semibold">Heads up:</b> ads usually start within 24 to 48 hours after approval, and reviews arrive gradually over the following days.</span>
          </p>

          <div>
            <label htmlFor="ad-reviews" className="text-sm font-semibold text-slate-800">How many reviews?</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <button type="button" onClick={() => setReviews((n) => clamp(n - STEP))} disabled={reviews <= min} aria-label={`Remove ${STEP} reviews`}
                  className="grid size-11 place-items-center rounded-l-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30">
                  <FaMinus className="size-3" />
                </button>
                <input id="ad-reviews" type="number" inputMode="numeric" min={min} max={max} value={reviews || ""}
                  onChange={(e) => setReviews(Math.floor(+e.target.value))}
                  className="w-20 bg-transparent text-center text-lg font-bold text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <button type="button" onClick={() => setReviews((n) => clamp(n + STEP))} disabled={reviews >= max} aria-label={`Add ${STEP} reviews`}
                  className="grid size-11 place-items-center rounded-r-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30">
                  <FaPlus className="size-3" />
                </button>
              </div>

              <span className="text-xs font-medium text-slate-400">or pick</span>
              {QUICK.filter((n) => n >= min && n <= max).map((q) => (
                <button key={q} type="button" onClick={() => setReviews(q)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${reviews === q ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {q}
                </button>
              ))}
            </div>
            {!valid && <p role="alert" className="mt-2 text-sm font-medium text-rose-600">Choose between {min} and {max.toLocaleString()} reviews.</p>}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Notes for our team <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="e.g. Promote our new menu, target nearby customers"
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </label>
        </div>

        {/* Cost summary */}
        <aside className="flex flex-col bg-blue-950 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Cost summary</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-blue-200">Price per review</dt><dd className="font-semibold">{npr(price)}</dd></div>
            <div className="flex justify-between"><dt className="text-blue-200">Reviews</dt><dd className="font-semibold">× {valid ? reviews.toLocaleString() : "—"}</dd></div>
          </dl>
          <div className="my-5 h-px bg-white/15" />
          <p className="text-sm text-blue-200">Estimated total</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">{valid ? npr(total) : "—"}</p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-blue-200">
            <FaCircleInfo className="mt-0.5 shrink-0" /> You’re charged {npr(price)} only for each review delivered. The price is locked when you request.
          </p>
          <button disabled={!valid}
            className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-amber-300 py-3.5 font-bold text-blue-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 max-lg:mt-6 lg:mt-8">
            Continue to payment <FaArrowRight className="size-3.5" />
          </button>
        </aside>
      </form>

      <ManualPaymentDialog ref={payDialog} amount={total} title={`Ad for ${reviews.toLocaleString()} reviews`} methods={methods} onSubmit={submitPayment} />

      {sent && (
        <p role="status" className="tab-fade flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <FaCircleCheck className="shrink-0" /> {sent}
        </p>
      )}
      {failed && (
        <p role="alert" className="tab-fade flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <FaTriangleExclamation className="shrink-0" /> {failed}
        </p>
      )}

      {/* Ads list */}
      <section className={`${card} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Your ads</h2>
          <div role="tablist" className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {FILTERS.map((f) => {
              const count = f === "all" ? ads.length : ads.filter((a) => a.status === f).length;
              return (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 capitalize transition ${filter === f ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  {f} <span className="rounded-full bg-slate-200/70 px-1.5 text-[11px] text-slate-600">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {shown.map((a) => {
            const s = STATUS[a.status];
            const pct = Math.round((a.delivered / a.reviews) * 100);
            const cost = a.reviews * a.pricePerReview;
            return (
              <li key={a.id} className="rounded-lg border border-slate-200 p-5 transition hover:border-slate-300">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-800"><FaBullhorn /></span>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
                        {a.id}
                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}><s.Icon className="size-3" /> {s.label}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {a.reviews.toLocaleString()} reviews · Requested {fmt(a.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900">
                      {a.status === "pending" ? npr(cost) : npr(a.delivered * a.pricePerReview)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.status === "pending" ? "estimated" : a.status === "running" ? `spent of ${npr(cost)}` : "paid"} · {npr(a.pricePerReview)}/review
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{a.delivered.toLocaleString()} / {a.reviews.toLocaleString()} reviews delivered</span>
                    <span className="font-semibold text-slate-900">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div style={{ width: `${pct}%` }} className={`h-full rounded-full ${s.bar}`} />
                  </div>
                </div>

                {a.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    {a.payment && (
                      <span className="flex items-center gap-1.5 font-medium text-blue-800">
                        <FaReceipt /> Payment proof submitted via {methods.find((m) => m.id === a.payment!.method)?.label ?? a.payment.method}
                        {a.payment.txnId && ` · Txn ${a.payment.txnId}`} · verifying
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-amber-700"><FaClock /> Usually starts within 24 to 48 hours of approval</span>
                  </div>
                )}
                {(a.notes || a.completedAt) && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                    {a.completedAt && <span className="flex items-center gap-1.5 text-emerald-700"><FaCalendarCheck /> Completed {fmt(a.completedAt)}</span>}
                    {a.notes && <span>Note: {a.notes}</span>}
                  </div>
                )}
              </li>
            );
          })}
          {!shown.length && (
            <li className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">No {filter === "all" ? "" : filter} ads yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
