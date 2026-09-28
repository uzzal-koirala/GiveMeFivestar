"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaXmark, FaCheck, FaFilePdf, FaArrowUpRightFromSquare, FaStore, FaTruckFast, FaBoxOpen, FaPrint, FaHourglassHalf, FaCircleXmark,
  FaCopy, FaLocationDot, FaPhone, FaUser, FaPalette, FaWandMagicSparkles, FaCircleExclamation, FaMagnifyingGlass, FaInbox, FaDownload,
} from "react-icons/fa6";
import { updateStandOrder } from "@/app/actions/stands";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { fmtDate } from "./ui";

export type StandItem = {
  id: string; userId: string; business: string; logoUrl: string | null; quantity: number; amount: number;
  design: string; designIsImage: boolean; designName: string | null; status: string; method: string; txnId: string;
  fullName: string; phone: string; province: string; district: string; city: string; address: string; landmark: string; notes: string;
  createdAt: string; decidedBy: string; decidedAt: string | null; shippedAt: string | null; deliveredAt: string | null; proofIsImage: boolean;
};

const npr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const TABS = [
  { id: "submitted", label: "New", Icon: FaHourglassHalf },
  { id: "printing", label: "Printing", Icon: FaPrint },
  { id: "shipped", label: "Shipped", Icon: FaTruckFast },
  { id: "delivered", label: "Delivered", Icon: FaBoxOpen },
  { id: "rejected", label: "Rejected", Icon: FaCircleXmark },
] as const;
const BADGE: Record<string, string> = {
  submitted: "bg-amber-50 text-amber-800 ring-amber-200", printing: "bg-violet-50 text-violet-700 ring-violet-200",
  shipped: "bg-blue-50 text-blue-800 ring-blue-200", delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200", rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};
const LABEL: Record<string, string> = { submitted: "Payment check", printing: "Printing", shipped: "Shipped", delivered: "Delivered", rejected: "Rejected" };
// the one next step for each status
const ACTIONS: Record<string, { to: "printing" | "shipped" | "delivered"; label: string; Icon: typeof FaCheck }> = {
  submitted: { to: "printing", label: "Approve & start printing", Icon: FaCheck },
  printing: { to: "shipped", label: "Mark as shipped", Icon: FaTruckFast },
  shipped: { to: "delivered", label: "Mark as delivered", Icon: FaBoxOpen },
};

export default function StandsBoard({ items }: { items: StandItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("submitted");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const open = items.find((o) => o.id === openId) ?? null;
  const shown = items.filter((o) => o.status === tab && (!q || `${o.business} ${o.fullName} ${o.phone} ${o.city} ${o.district}`.toLowerCase().includes(q.toLowerCase())));

  const show = (id: string) => { setOpenId(id); setError(""); setCopied(false); dialog.current?.showModal(); };
  async function move(o: StandItem, to: "printing" | "rejected" | "shipped" | "delivered") {
    if (to === "rejected" && !confirm(`Reject the ${npr(o.amount)} payment from ${o.business}?`)) return;
    setBusy(true);
    const r = await updateStandOrder(o.id, to);
    setBusy(false);
    setError(r.error ?? "");
    if (!r.error) router.refresh();
  }
  const fullAddress = (o: StandItem) => [o.fullName, o.phone, o.address, o.landmark && `Near ${o.landmark}`, `${o.city}, ${o.district}`, `${o.province} Province`].filter(Boolean).join("\n");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => {
            const n = items.filter((o) => o.status === id).length;
            return (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition ${tab === id ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <Icon className="size-3.5" /> {label}
                <span className={`rounded-full px-1.5 text-xs ${tab === id ? "bg-white/15" : id === "submitted" && n ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="relative ml-auto block w-full min-w-0 sm:w-64">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business, name, city" aria-label="Search orders"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>

      {!shown.length ? (
        <div className="grid place-items-center rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm">
          <FaInbox className="size-8 text-slate-200" />
          <p className="mt-3 font-semibold text-slate-700">No {LABEL[tab].toLowerCase()} orders</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => show(o.id)} className="group flex h-full w-full flex-col rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                <div className="flex w-full items-center gap-3">
                  {o.logoUrl ? <img src={o.logoUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : <span className={`grid size-10 shrink-0 place-items-center rounded-lg text-xs font-bold text-white ${colorFor(o.business)}`}>{initials(o.business)}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900 group-hover:text-blue-800">{o.business}</p>
                    <p className="text-xs text-slate-500">{fmtDate(o.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${BADGE[o.status]}`}>{LABEL[o.status]}</span>
                </div>
                <div className="mt-4 flex w-full items-end justify-between">
                  <div>
                    <p className="text-3xl font-extrabold tracking-tight text-slate-900">{o.quantity}<span className="ml-1 text-sm font-semibold text-slate-500">stand{o.quantity > 1 ? "s" : ""}</span></p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">{o.design === "custom" ? <><FaPalette className="size-3 text-violet-600" /> Their own design</> : <><FaWandMagicSparkles className="size-3 text-blue-700" /> Standard design</>}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{npr(o.amount)}</p>
                </div>
                <p className="mt-4 flex w-full items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"><FaLocationDot className="mt-0.5 size-3 shrink-0 text-slate-400" /> <span className="line-clamp-2">{o.city}, {o.district}, {o.province}</span></p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialog} onClose={() => setOpenId(null)} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()} aria-label="Stand order"
        className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        {open && (
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{open.quantity} QR stand{open.quantity > 1 ? "s" : ""} for {open.business}</p>
                <p className="text-xs text-slate-500">Ordered {fmtDate(open.createdAt)} · {npr(open.amount)} via {open.method}{open.txnId && ` · Txn ${open.txnId}`}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${BADGE[open.status]}`}>{LABEL[open.status]}</span>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 md:grid-cols-2">
              {/* delivery */}
              <div className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deliver to</p>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(fullAddress(open)); setCopied(true); }} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
                    {copied ? <><FaCheck className="size-3" /> Copied</> : <><FaCopy className="size-3" /> Copy address</>}
                  </button>
                </div>
                <p className="mt-3 flex items-center gap-2 font-bold text-slate-900"><FaUser className="size-3 text-slate-400" /> {open.fullName}</p>
                <a href={`tel:${open.phone}`} className="mt-1 flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><FaPhone className="size-3" /> {open.phone}</a>
                <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-700"><FaLocationDot className="mt-1 size-3 shrink-0 text-slate-400" />
                  <span>{open.address}{open.landmark && <><br /><span className="text-slate-500">Near {open.landmark}</span></>}<br />{open.city}, {open.district}<br />{open.province} Province</span>
                </p>
                {open.notes && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100"><b>Note:</b> {open.notes}</p>}
              </div>

              {/* files */}
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Design</p>
                  {open.design === "custom" ? (
                    <a href={`/api/admin/stand/${open.id}/design`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl border border-slate-200 p-2 pr-4 hover:border-blue-300">
                      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                        {open.designIsImage ? <img src={`/api/admin/stand/${open.id}/design`} alt="Customer design" className="size-full object-cover" /> : <FaFilePdf className="size-7 text-rose-500" />}
                      </span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{open.designName}</span><span className="text-xs text-slate-500">Their own design</span></span>
                      <FaDownload className="size-3.5 text-slate-400 group-hover:text-blue-700" />
                    </a>
                  ) : (
                    <p className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><FaWandMagicSparkles className="size-3.5" /> Standard design with their QR code</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payment proof</p>
                  <a href={`/api/admin/stand/${open.id}/proof`} target="_blank" rel="noopener noreferrer" className="group relative grid h-40 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {open.proofIsImage ? <img src={`/api/admin/stand/${open.id}/proof`} alt="Payment proof" className="size-full object-cover" /> : <FaFilePdf className="size-10 text-rose-500" />}
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-slate-900/70 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"><FaArrowUpRightFromSquare className="size-2.5" /> Open proof</span>
                  </a>
                </div>
              </div>
            </div>

            {/* timeline */}
            <ol className="mx-6 mb-6 space-y-1.5 rounded-xl border border-slate-100 p-4 text-xs text-slate-600">
              <li><b className="text-slate-800">Ordered</b> {fmtDate(open.createdAt)}</li>
              {open.decidedAt && <li><b className="text-slate-800">{open.status === "rejected" ? "Rejected" : "Approved"}</b> by {open.decidedBy} on {fmtDate(open.decidedAt)}</li>}
              {open.shippedAt && <li><b className="text-slate-800">Shipped</b> {fmtDate(open.shippedAt)}</li>}
              {open.deliveredAt && <li><b className="text-slate-800">Delivered</b> {fmtDate(open.deliveredAt)}</li>}
            </ol>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Link href={`/admin/businesses/${open.userId}`} className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><FaStore className="size-3" /> Business profile</Link>
              {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
              <div className="ml-auto flex gap-2">
                {open.status === "submitted" && (
                  <button type="button" disabled={busy} onClick={() => move(open, "rejected")} className="flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><FaXmark /> Reject</button>
                )}
                {ACTIONS[open.status] && (() => { const { to, label, Icon } = ACTIONS[open.status]; return (
                  <button type="button" disabled={busy} onClick={() => move(open, to)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><Icon /> {label}</button>
                ); })()}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
