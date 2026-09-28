"use client";

import { useEffect, useState } from "react";
import {
  FaStar, FaQuoteLeft, FaCopy, FaCheck, FaLocationDot, FaTableCellsLarge, FaList, FaGoogle, FaCommentDots, FaPhone, FaQrcode,
} from "react-icons/fa6";
import Link from "next/link";
import type { Customer } from "@/lib/types";
import { colorFor } from "./CustomersTable";
import { useFilters } from "./useFilters";
import AdBadge from "@/components/ui/AdBadge";

type Kind = "google" | "feedback";
const RATING_LABELS = ["", "Very poor", "Poor", "Okay", "Good", "Excellent"];
const RATING_TONE = ["", "bg-rose-50 text-rose-700", "bg-rose-50 text-rose-700", "bg-amber-50 text-amber-700", "bg-emerald-50 text-emerald-700", "bg-emerald-50 text-emerald-700"];

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function CopyReview({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} aria-label="Copy review" title="Copy review" className="grid size-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
      {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
    </button>
  );
}

function Stars({ value = 5, size = "size-4" }: { value?: number; size?: string }) {
  return (
    <div className="flex gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <FaStar key={n} className={`${size} ${n <= value ? "text-amber-400" : "text-slate-200"}`} />)}
    </div>
  );
}

function Avatar({ name, size = "size-10" }: { name: string; size?: string }) {
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full text-sm font-bold text-white ${colorFor(name)}`}>{initials(name)}</span>;
}

const Where = ({ c }: { c: Customer }) => (
  <p className="flex items-center gap-1 text-xs text-slate-500">
    {c.location && <><FaLocationDot className="size-3" /> {c.location} ·</>} {fmt(c.date)}
  </p>
);

// ---- Google reviews ----
function ReviewCard({ c }: { c: Customer }) {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/5">
      <FaQuoteLeft className="absolute right-6 top-6 size-8 text-blue-50 transition group-hover:text-blue-100" />
      <Stars value={c.rating} />
      <p className="mt-4 flex-1 leading-relaxed text-slate-700">“{c.review}”</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{c.product}</span>
        {c.adId && <AdBadge adId={c.adId} />}
      </div>
      <footer className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
        <Avatar name={c.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{c.name}</p>
          <Where c={c} />
        </div>
        <CopyReview text={c.review} />
      </footer>
    </article>
  );
}

function ReviewRow({ c }: { c: Customer }) {
  return (
    <article className="flex flex-col gap-4 p-5 transition hover:bg-blue-50/30 sm:flex-row sm:items-start sm:gap-5 sm:px-6">
      <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
        <Avatar name={c.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{c.name}</p>
          <Where c={c} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <Stars value={c.rating} size="size-3.5" />
        <p className="mt-2 leading-relaxed text-slate-700">{c.review}</p>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{c.product}</span>
        {c.adId && <AdBadge adId={c.adId} />}
        <CopyReview text={c.review} />
      </div>
    </article>
  );
}

// ---- Feedback (no written review) ----
function FeedbackCard({ c }: { c: Customer }) {
  const r = c.rating ?? 5;
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/5">
      <div className="flex items-center justify-between gap-3">
        <Stars value={r} />
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RATING_TONE[r]}`}>{RATING_LABELS[r]}</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">Tried</p>
      <p className="text-lg font-bold text-slate-900">{c.product}</p>
      {c.feedback && <p className="mt-3 line-clamp-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700" title={c.feedback}>“{c.feedback}”</p>}
      <footer className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
        <Avatar name={c.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{c.name}</p>
          <Where c={c} />
        </div>
        {c.phone && (
          <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`} title={c.phone}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100">
            <FaPhone className="size-3.5" />
          </a>
        )}
      </footer>
    </article>
  );
}

function FeedbackRow({ c }: { c: Customer }) {
  const r = c.rating ?? 5;
  return (
    <article className="flex flex-wrap items-center gap-4 p-5 transition hover:bg-blue-50/30 sm:px-6">
      <div className="flex min-w-52 flex-1 items-center gap-3">
        <Avatar name={c.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{c.name}</p>
          <Where c={c} />
          {c.feedback && <p className="mt-1 line-clamp-2 text-sm text-slate-600" title={c.feedback}>“{c.feedback}”</p>}
        </div>
      </div>
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{c.product}</span>
      <div className="flex items-center gap-2">
        <Stars value={r} size="size-3.5" />
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RATING_TONE[r]}`}>{RATING_LABELS[r]}</span>
      </div>
      {c.phone ? (
        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-700"><FaPhone className="size-3 text-slate-400" /> {c.phone}</a>
      ) : <span className="text-sm text-slate-400">No phone</span>}
    </article>
  );
}

export default function ReviewCards({ items }: { items: Customer[] }) {
  const [kind, setKind] = useState<Kind>("google");
  const [view, setView] = useState<"grid" | "list">("grid");
  const google = items.filter((i) => i.review);
  const feedback = items.filter((i) => !i.review);
  const current = kind === "google" ? google : feedback;
  const { rows, bar } = useFilters(current, kind === "google" ? ["name", "review"] : ["name", "product", "phone", "feedback"],
    kind === "google" ? "Search reviews or customer name" : "Search name, product, phone or comment");

  // remember the chosen tab and view in this browser
  useEffect(() => {
    try {
      if (localStorage.getItem("reviews-view") === "list") setView("list");
      if (localStorage.getItem("reviews-kind") === "feedback") setKind("feedback");
    } catch {}
  }, []);
  const choose = (v: "grid" | "list") => { setView(v); try { localStorage.setItem("reviews-view", v); } catch {} };
  const chooseKind = (k: Kind) => { setKind(k); try { localStorage.setItem("reviews-kind", k); } catch {} };

  const TABS = [
    { id: "google" as const, label: "Google reviews", Icon: FaGoogle, count: google.length, hint: "AI-written reviews customers posted to Google" },
    { id: "feedback" as const, label: "Feedback", Icon: FaCommentDots, count: feedback.length, hint: "Details and ratings from “Details only” mode" },
  ];

  return (
    <div className="space-y-6">
      {/* Google reviews / Feedback */}
      <div role="tablist" aria-label="Review type" className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, Icon, count }) => {
          const on = kind === id;
          return (
            <button key={id} type="button" role="tab" aria-selected={on} onClick={() => chooseKind(id)}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-semibold sm:gap-2.5 sm:px-4 sm:py-3 sm:text-sm transition ${on ? "bg-blue-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
              <Icon className="size-3.5 shrink-0 sm:size-4" /> {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] sm:px-2 sm:text-xs ${on ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {current.length === 0 ? (
        <div key={kind} className="tab-fade grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-300">
            {kind === "google" ? <FaGoogle className="size-6" /> : <FaCommentDots className="size-6" />}
          </span>
          <p className="mt-4 font-semibold text-slate-800">{kind === "google" ? "No Google reviews yet" : "No feedback yet"}</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {kind === "google"
              ? "When customers scan your QR code and write a review, it shows up here."
              : "Feedback appears here when your review page is set to “Details only” in Settings."}
          </p>
          <Link href="/dashboard" className="mt-5 flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
            <FaQrcode className="size-3.5" /> Get your QR code
          </Link>
        </div>
      ) : (
        <div key={kind} className="tab-fade space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">{bar}</div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Showing <b className="text-slate-800">{rows.length}</b> of {current.length} {kind === "google" ? "reviews" : "feedback"}
            </p>
            <div role="radiogroup" aria-label="View" className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {([["grid", FaTableCellsLarge, "Grid"], ["list", FaList, "List"]] as const).map(([v, Icon, label]) => (
                <button key={v} role="radio" aria-checked={view === v} onClick={() => choose(v)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${view === v ? "bg-blue-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  <Icon className="size-3.5" /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {!rows.length ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <FaStar className="size-8 text-slate-200" />
              <p className="mt-3 font-semibold text-slate-700">Nothing matches these filters</p>
              <p className="text-sm text-slate-500">Try clearing a filter or searching something else.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rows.map((c) => (kind === "google" ? <ReviewCard key={c.id} c={c} /> : <FeedbackCard key={c.id} c={c} />))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {rows.map((c) => (kind === "google" ? <ReviewRow key={c.id} c={c} /> : <FeedbackRow key={c.id} c={c} />))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
