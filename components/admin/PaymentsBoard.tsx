"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaCheck, FaXmark, FaFilePdf, FaCircleExclamation, FaInbox, FaMagnifyingGlass, FaArrowUpRightFromSquare, FaStore, FaCrown, FaBolt,
  FaClock, FaHourglassHalf, FaClockRotateLeft, FaCircleCheck, FaCircleXmark, FaLayerGroup, FaUserShield, FaExpand,
} from "react-icons/fa6";
import { decidePayment } from "@/app/actions/admin";
import { npr } from "@/components/ui/PaymentMethods";
import FilterSelect from "@/components/ui/FilterSelect";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { fmtDate } from "./ui";

export type PaymentItem = {
  id: string; userId: string; business: string; email: string; logoUrl: string | null;
  kind: "plan" | "topup"; title: string; detail: string; amount: number; method: string; txnId: string;
  date: string; status: "submitted" | "approved" | "rejected"; decidedAt: string | null; decidedBy: string;
  proofUrl: string; proofIsImage: boolean;
};

const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};
const dayLabel = (iso: string) => {
  const d = new Date(iso), today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const KIND = {
  plan: { Icon: FaCrown, tint: "bg-amber-100 text-amber-700", label: "Plan upgrade" },
  topup: { Icon: FaBolt, tint: "bg-blue-100 text-blue-800", label: "AI top-up" },
};
const STATUS = {
  submitted: { label: "Waiting", cls: "bg-amber-50 text-amber-800 ring-amber-200", Icon: FaHourglassHalf },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: FaCircleCheck },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 ring-rose-200", Icon: FaCircleXmark },
};

function Logo({ p, size = "size-10" }: { p: PaymentItem; size?: string }) {
  return p.logoUrl
    ? <img src={p.logoUrl} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />
    : <span className={`grid ${size} shrink-0 place-items-center rounded-lg text-xs font-bold text-white ${colorFor(p.business)}`}>{initials(p.business)}</span>;
}
const Badge = ({ s }: { s: PaymentItem["status"] }) => {
  const { label, cls, Icon } = STATUS[s];
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${cls}`}><Icon className="size-2.5" /> {label}</span>;
};

export default function PaymentsBoard({ items }: { items: PaymentItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"waiting" | "history">("waiting");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [outcome, setOutcome] = useState<"all" | "approved" | "rejected">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = items.find((p) => p.id === openId) ?? null;
  const show = (id: string) => { setOpenId(id); setError(""); dialog.current?.showModal(); };
  const match = (p: PaymentItem) => (kind === "all" || p.kind === kind) && (!q || `${p.business} ${p.email} ${p.txnId}`.toLowerCase().includes(q.toLowerCase()));
  const waiting = items.filter((p) => p.status === "submitted");
  const decided = items.filter((p) => p.status !== "submitted").sort((a, b) => Date.parse(b.decidedAt ?? b.date) - Date.parse(a.decidedAt ?? a.date));
  const shownWaiting = waiting.filter(match).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)); // oldest first: first come, first served
  const shownHistory = decided.filter((p) => match(p) && (outcome === "all" || p.status === outcome));
  // history grouped by the day it was decided
  const groups = shownHistory.reduce<{ day: string; rows: PaymentItem[] }[]>((acc, p) => {
    const day = dayLabel(p.decidedAt ?? p.date);
    (acc.at(-1)?.day === day ? acc.at(-1)!.rows : (acc.push({ day, rows: [] }), acc.at(-1)!.rows)).push(p);
    return acc;
  }, []);

  async function decide(p: PaymentItem, approve: boolean) {
    if (!approve && !confirm(`Reject ${npr(p.amount)} from ${p.business}? They will see it as rejected.`)) return;
    setBusy(true);
    const res = await decidePayment(p.id, approve);
    setBusy(false);
    setError(res.error ?? "");
    if (!res.error) router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div role="tablist" className="flex gap-1">
          {([["waiting", "Waiting", FaHourglassHalf, waiting.length], ["history", "History", FaClockRotateLeft, decided.length]] as const).map(([id, label, Icon, n]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
              <Icon className="size-3.5" /> {label}
              <span className={`rounded-full px-1.5 text-xs ${tab === id ? "bg-white/15" : id === "waiting" && n ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{n}</span>
            </button>
          ))}
        </div>
        <label className="relative ml-auto block w-full min-w-0 sm:w-64">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business or txn ID" aria-label="Search payments"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </label>
        <FilterSelect label="Type" Icon={FaLayerGroup} value={kind} onChange={setKind}
          options={[{ value: "all", label: "All types" }, { value: "plan", label: "Plan upgrades" }, { value: "topup", label: "AI top-ups" }]} />
      </div>

      {tab === "waiting" ? (
        !shownWaiting.length ? (
          <div className="grid place-items-center rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm">
            <span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-500"><FaCircleCheck className="size-6" /></span>
            <p className="mt-3 font-semibold text-slate-800">{q || kind !== "all" ? "No waiting payments match" : "All caught up!"}</p>
            <p className="mt-1 text-sm text-slate-500">New payment proofs will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shownWaiting.map((p) => {
              const k = KIND[p.kind];
              return (
                <article key={p.id} className="group flex flex-col overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm transition hover:shadow-md">
                  <button type="button" onClick={() => show(p.id)} className="relative block h-40 overflow-hidden bg-slate-100" aria-label={`Open payment from ${p.business}`}>
                    {p.proofIsImage ? <img src={p.proofUrl} alt="" className="size-full object-cover transition group-hover:scale-105" /> : <span className="grid size-full place-items-center"><FaFilePdf className="size-10 text-rose-500" /></span>}
                    <span className="absolute inset-0 grid place-items-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100"><FaExpand className="size-5" /></span>
                    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow"><FaClock className="size-2.5 text-amber-500" /> {ago(p.date)}</span>
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-3">
                      <Logo p={p} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{p.business}</p>
                        <p className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${k.tint}`}><k.Icon className="size-2.5" /> {p.title}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-2">
                      <p className="text-2xl font-extrabold tracking-tight text-slate-900">{npr(p.amount)}</p>
                      <p className="text-right text-xs text-slate-500">{p.method}{p.txnId && <><br />Txn {p.txnId}</>}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" disabled={busy} onClick={() => decide(p, false)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><FaXmark /> Reject</button>
                      <button type="button" disabled={busy} onClick={() => decide(p, true)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"><FaCheck /> Approve</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div role="radiogroup" aria-label="Outcome" className="inline-flex gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {(["all", "approved", "rejected"] as const).map((o) => (
              <button key={o} type="button" role="radio" aria-checked={outcome === o} onClick={() => setOutcome(o)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${outcome === o ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
                {o === "all" ? "Everything" : o}
              </button>
            ))}
          </div>
          {!groups.length ? (
            <div className="grid place-items-center rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm">
              <FaInbox className="size-8 text-slate-200" />
              <p className="mt-3 font-semibold text-slate-700">No decisions yet</p>
            </div>
          ) : groups.map(({ day, rows }) => (
            <section key={day}>
              <h3 className="mb-2 flex items-center gap-3 px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                {day} <span className="h-px flex-1 bg-slate-200" />
                <span className="normal-case tracking-normal text-slate-400">{npr(rows.filter((r) => r.status === "approved").reduce((n, r) => n + r.amount, 0))} approved</span>
              </h3>
              <ol className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {rows.map((p) => {
                  const approved = p.status === "approved";
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => show(p.id)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-slate-50">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${approved ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                          {approved ? <FaCheck className="size-3.5" /> : <FaXmark className="size-3.5" />}
                        </span>
                        <Logo p={p} size="size-9" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-800"><b>{p.business}</b> · {p.title}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {approved ? "Approved" : "Rejected"} by <b className="font-semibold text-slate-700">{p.decidedBy || "an admin"}</b>
                            {p.decidedAt ? ` at ${time(p.decidedAt)}` : ""} · {p.method}{p.txnId && ` · ${p.txnId}`}
                          </span>
                        </span>
                        <span className={`shrink-0 text-right font-bold tabular-nums ${approved ? "text-slate-900" : "text-slate-400 line-through"}`}>{npr(p.amount)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {/* detail popup */}
      <dialog ref={dialog} onClose={() => setOpenId(null)} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()} aria-label="Payment details"
        className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        {open && (
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <Logo p={open} size="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{open.business}</p>
                <p className="truncate text-xs text-slate-500">{open.email}</p>
              </div>
              <Badge s={open.status} />
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[210px_1fr]">
              <a href={open.proofUrl} target="_blank" rel="noopener noreferrer" title="Open payment proof"
                className="group relative grid aspect-[3/4] place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {open.proofIsImage ? <img src={open.proofUrl} alt="Payment proof" className="size-full object-cover" /> : <FaFilePdf className="size-12 text-rose-500" />}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-slate-900/70 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  <FaArrowUpRightFromSquare className="size-2.5" /> Open proof
                </span>
              </a>
              <div className="min-w-0">
                <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${KIND[open.kind].tint}`}>{(() => { const I = KIND[open.kind].Icon; return <I className="size-3" />; })()} {KIND[open.kind].label}</p>
                <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{npr(open.amount)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{open.title}</p>
                <p className="text-sm text-slate-500">{open.detail}</p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[["Paid with", open.method || "—"], ["Transaction ID", open.txnId || "—"], ["Sent", `${fmtDate(open.date)}, ${time(open.date)}`], ["Waited", open.decidedAt ? `${Math.max(1, Math.round((Date.parse(open.decidedAt) - Date.parse(open.date)) / 6e4))} min` : ago(open.date)]].map(([k, v]) => (
                    <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="break-all font-semibold text-slate-900">{v}</dd></div>
                  ))}
                </dl>
                {open.status !== "submitted" && (
                  <p className={`mt-5 flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-sm ${open.status === "approved" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                    <FaUserShield className="shrink-0" />
                    <span>{open.status === "approved" ? "Approved" : "Rejected"} by <b>{open.decidedBy || "an admin"}</b>{open.decidedAt && <> on {fmtDate(open.decidedAt)} at {time(open.decidedAt)}</>}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Link href={`/admin/businesses/${open.userId}`} className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><FaStore className="size-3" /> Business profile</Link>
              {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
              {open.status === "submitted" && (
                <div className="ml-auto flex gap-2">
                  <button type="button" disabled={busy} onClick={() => decide(open, false)}
                    className="flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><FaXmark /> Reject</button>
                  <button type="button" disabled={busy} onClick={() => decide(open, true)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><FaCheck /> Approve</button>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
