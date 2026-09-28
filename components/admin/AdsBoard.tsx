"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaCheck, FaXmark, FaFilePdf, FaCircleExclamation, FaInbox, FaTableCellsLarge, FaList, FaMagnifyingGlass, FaChevronRight,
  FaArrowUpRightFromSquare, FaStore, FaQuoteLeft,
} from "react-icons/fa6";
import { decideAd, setAdDelivered } from "@/app/actions/admin";
import { npr } from "@/components/ui/PaymentMethods";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { StatusBadge, card, fmtDate } from "./ui";

export type AdItem = {
  id: string; userId: string; business: string; email: string; logoUrl: string | null;
  reviews: number; delivered: number; pricePerReview: number; notes: string;
  status: string; paymentStatus: string; method: string; txnId: string; date: string;
  proofUrl: string; proofIsImage: boolean;
};

const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
// the payment decides first; after approval the ad's own status matters
const stateOf = (a: AdItem) => (a.paymentStatus === "submitted" ? "submitted" : a.status);
const needsAction = (a: AdItem) => a.paymentStatus === "submitted" || a.status === "running";
const FILTERS = [
  { id: "action", label: "Needs action", test: needsAction },
  { id: "running", label: "Running", test: (a: AdItem) => a.status === "running" },
  { id: "completed", label: "Completed", test: (a: AdItem) => a.status === "completed" },
  { id: "all", label: "All", test: () => true },
] as const;

function Logo({ a, size }: { a: AdItem; size: string }) {
  return a.logoUrl
    ? <img src={a.logoUrl} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />
    : <span className={`grid ${size} shrink-0 place-items-center rounded-lg text-xs font-bold text-white ${colorFor(a.business)}`}>{initials(a.business)}</span>;
}

function Progress({ a }: { a: AdItem }) {
  const pct = Math.min(100, Math.round((a.delivered / a.reviews) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span><b className="text-slate-900">{a.delivered}</b> / {a.reviews} delivered</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Progress bar + "delivered so far" input for a running ad
function DeliveredControl({ id, ad }: { id: string; ad: { reviews: number; delivered: number } }) {
  const router = useRouter();
  const [value, setValue] = useState(String(ad.delivered));
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const pct = Math.round((ad.delivered / ad.reviews) * 100);
  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} /></div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-slate-500">Delivered</span>
        <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" aria-label="Reviews delivered"
          className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center font-semibold outline-none focus:border-blue-600 focus:bg-white" />
        <span className="text-slate-500">of {ad.reviews}</span>
        <button type="button" disabled={pending || value === String(ad.delivered)}
          onClick={() => start(async () => { const r = await setAdDelivered(id, Number(value)); setError(r.error ?? ""); if (!r.error) router.refresh(); })}
          className="rounded-lg bg-blue-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">Update</button>
        {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      </div>
    </div>
  );
}

// Ad requests: box or list, each opens a popup with proof, details and actions
export default function AdsBoard({ items }: { items: AdItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("action");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // remember the chosen view in this browser
  useEffect(() => { try { if (localStorage.getItem("admin-ads-view") === "list") setView("list"); } catch {} }, []);
  const choose = (v: "grid" | "list") => { setView(v); try { localStorage.setItem("admin-ads-view", v); } catch {} };

  const open = items.find((a) => a.id === openId) ?? null;
  const show = (id: string) => { setOpenId(id); setError(""); dialog.current?.showModal(); };
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const shown = items.filter((a) => test(a) && (!q || `${a.business} ${a.email} ${a.txnId}`.toLowerCase().includes(q.toLowerCase())));

  async function decide(approve: boolean) {
    if (!open) return;
    if (!approve && !confirm("Reject this payment? The business will see it as rejected.")) return;
    setBusy(true);
    const res = await decideAd(open.id, approve);
    setBusy(false);
    setError(res.error ?? "");
    if (!res.error) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => {
            const n = items.filter(f.test).length;
            return (
              <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${filter === f.id ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                {f.label}
                <span className={`rounded-full px-1.5 text-xs ${filter === f.id ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="relative ml-auto block w-full min-w-0 sm:w-64">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business or txn ID" aria-label="Search ads"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </label>
        <div role="radiogroup" aria-label="View" className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {([["grid", FaTableCellsLarge, "Box"], ["list", FaList, "List"]] as const).map(([v, Icon, label]) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => choose(v)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === v ? "bg-blue-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <Icon className="size-3.5" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {!shown.length ? (
        <div className={`${card} grid place-items-center py-16 text-center`}>
          <FaInbox className="size-8 text-slate-200" />
          <p className="mt-3 font-semibold text-slate-700">{filter === "action" && !q ? "Nothing waiting. All caught up!" : "No ads here."}</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <button key={a.id} type="button" onClick={() => show(a.id)}
              className={`group flex flex-col rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${stateOf(a) === "submitted" ? "border-amber-200" : "border-slate-200"}`}>
              <div className="flex w-full items-center gap-3">
                <Logo a={a} size="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 group-hover:text-blue-800">{a.business}</p>
                  <p className="text-xs text-slate-500">{fmtDate(a.date)}</p>
                </div>
                <StatusBadge status={stateOf(a)} />
              </div>
              <div className="mt-4 flex w-full items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">{a.reviews.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">reviews · Rs {a.pricePerReview}/review</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{npr(a.reviews * a.pricePerReview)}</p>
              </div>
              <div className="mt-4 w-full">
                {stateOf(a) === "submitted" ? (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Payment proof waiting for review</p>
                ) : stateOf(a) === "rejected" ? (
                  <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Payment rejected</p>
                ) : <Progress a={a} />}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <ul className={`${card} divide-y divide-slate-100`}>
          {shown.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => show(a.id)}
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[auto_minmax(0,2fr)_7rem_minmax(0,1.5fr)_6.5rem_auto]">
                <Logo a={a} size="size-10" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{a.business}</span>
                  <span className="block truncate text-xs text-slate-500">{a.reviews.toLocaleString()} reviews · {fmtDate(a.date)}</span>
                </span>
                <span className="hidden text-sm font-bold text-slate-900 md:block">{npr(a.reviews * a.pricePerReview)}</span>
                <span className="hidden md:block">{stateOf(a) === "running" || stateOf(a) === "completed" ? <Progress a={a} /> : <span className="text-xs text-slate-400">{a.method}{a.txnId && ` · ${a.txnId}`}</span>}</span>
                <span className="md:text-center"><StatusBadge status={stateOf(a)} /></span>
                <FaChevronRight className="hidden size-3 text-slate-400 md:block" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Detail popup */}
      <dialog ref={dialog} onClose={() => setOpenId(null)} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()} aria-label="Ad details"
        className="auth-dialog no-scrollbar m-auto border-0 outline-none max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        {open && (
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <Logo a={open} size="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{open.business}</p>
                <p className="truncate text-xs text-slate-500">{open.email}</p>
              </div>
              <StatusBadge status={stateOf(open)} />
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Close"
                className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr]">
              <a href={open.proofUrl} target="_blank" rel="noopener noreferrer" title="Open payment proof"
                className="group relative grid aspect-[3/4] place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {open.proofIsImage ? <img src={open.proofUrl} alt="Payment proof" className="size-full object-cover" /> : <FaFilePdf className="size-12 text-rose-500" />}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-slate-900/70 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  <FaArrowUpRightFromSquare className="size-2.5" /> Open proof
                </span>
              </a>

              <div className="min-w-0">
                <p className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">{open.reviews.toLocaleString()} <span className="text-base font-semibold text-slate-500">reviews</span></p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ["Total", npr(open.reviews * open.pricePerReview)],
                    ["Price", `Rs ${open.pricePerReview} / review`],
                    ["Paid with", open.method || "—"],
                    ["Transaction ID", open.txnId || "—"],
                    ["Requested", fmtDate(open.date)],
                    ["Delivered", `${open.delivered} of ${open.reviews}`],
                  ].map(([k, v]) => (
                    <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="break-all font-semibold text-slate-900">{v}</dd></div>
                  ))}
                </dl>
                {open.notes && (
                  <p className="mt-4 flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600"><FaQuoteLeft className="mt-0.5 size-3 shrink-0 text-slate-300" /> {open.notes}</p>
                )}
                {(open.status === "running" || open.status === "completed") && open.paymentStatus === "approved" && (
                  <div className="mt-4 rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery</p>
                    <DeliveredControl key={open.delivered} id={open.id} ad={open} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Link href={`/admin/businesses/${open.userId}`} className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
                <FaStore className="size-3" /> Business profile
              </Link>
              {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
              {open.paymentStatus === "submitted" && (
                <div className="ml-auto flex gap-2">
                  <button type="button" disabled={busy} onClick={() => decide(false)}
                    className="flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                    <FaXmark /> Reject
                  </button>
                  <button type="button" disabled={busy} onClick={() => decide(true)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                    <FaCheck /> Approve & start
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
