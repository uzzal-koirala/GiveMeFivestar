"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaEnvelope, FaEnvelopeOpen, FaPhone, FaWhatsapp, FaXmark, FaCheck, FaTrashCan, FaRotateLeft, FaMagnifyingGlass, FaInbox, FaStore, FaLocationDot, FaTag, FaCircleExclamation,
} from "react-icons/fa6";
import { deleteMessage, setMessageHandled } from "@/app/actions/contact";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { fmtDate } from "./ui";

export type MessageItem = {
  id: string; name: string; phone: string; email: string; business: string; city: string; topic: string; message: string;
  status: "new" | "handled"; handledBy: string; handledAt: string | null; createdAt: string;
};

const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};
const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^(9[678]\d{8})$/, "977$1")}`;

export default function MessagesBoard({ items }: { items: MessageItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"new" | "handled">("new");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = items.find((m) => m.id === openId) ?? null;
  const shown = items.filter((m) => m.status === tab && (!q || `${m.name} ${m.phone} ${m.email} ${m.business} ${m.city} ${m.message}`.toLowerCase().includes(q.toLowerCase())));

  const show = (id: string) => { setOpenId(id); setError(""); setConfirmDel(false); dialog.current?.showModal(); };
  async function run(fn: () => Promise<{ error?: string }>, close = false) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.error) return setError(r.error);
    if (close) dialog.current?.close();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div role="tablist" className="flex gap-1">
          {([["new", "New", FaEnvelope], ["handled", "Handled", FaEnvelopeOpen]] as const).map(([id, label, Icon]) => {
            const n = items.filter((m) => m.status === id).length;
            return (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <Icon className="size-3.5" /> {label}
                <span className={`rounded-full px-1.5 text-xs ${tab === id ? "bg-white/15" : id === "new" && n ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="relative ml-auto block w-full min-w-0 sm:w-72">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, business, message" aria-label="Search messages"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>

      {!shown.length ? (
        <div className="grid place-items-center rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm">
          <FaInbox className="size-8 text-slate-200" />
          <p className="mt-3 font-semibold text-slate-700">{tab === "new" ? "No new messages" : "Nothing handled yet"}</p>
          <p className="mt-1 text-sm text-slate-500">Messages from the contact form on your website appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {shown.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => show(m.id)} className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${colorFor(m.name)}`}>{initials(m.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <b className={`text-slate-900 ${m.status === "new" ? "" : "font-semibold"}`}>{m.name}</b>
                    {m.business && <span className="text-sm text-slate-500">· {m.business}</span>}
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">{m.topic}</span>
                    <span className="ml-auto text-xs text-slate-400">{ago(m.createdAt)}</span>
                  </span>
                  <span className="mt-1 line-clamp-1 block text-sm text-slate-600">{m.message}</span>
                </span>
                {m.status === "new" && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-amber-400" aria-label="New" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialog} onClose={() => setOpenId(null)} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()} aria-label="Message"
        className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        {open && (
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <span className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${colorFor(open.name)}`}>{initials(open.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{open.name}</p>
                <p className="text-xs text-slate-500">{fmtDate(open.createdAt)} · {ago(open.createdAt)}</p>
              </div>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-800"><FaTag className="size-2.5" /> {open.topic}</span>
                {open.business && <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"><FaStore className="size-2.5" /> {open.business}</span>}
                {open.city && <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"><FaLocationDot className="size-2.5" /> {open.city}</span>}
              </div>
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-100">{open.message}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <a href={`tel:${open.phone}`} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800"><FaPhone className="size-3" /> Call</a>
                <a href={wa(open.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-emerald-700 hover:border-emerald-300"><FaWhatsapp className="size-3.5" /> WhatsApp</a>
                {open.email
                  ? <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.topic}`)}`} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800"><FaEnvelope className="size-3" /> Email</a>
                  : <span className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-2.5 text-xs text-slate-400">No email given</span>}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-slate-500">Phone</dt><dd className="font-semibold text-slate-900">{open.phone}</dd></div>
                <div><dt className="text-xs text-slate-500">Email</dt><dd className="break-all font-semibold text-slate-900">{open.email || "—"}</dd></div>
              </dl>
              {open.status === "handled" && open.handledAt && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"><FaCheck className="size-3" /> Handled by <b>{open.handledBy}</b> on {fmtDate(open.handledAt)}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              {confirmDel ? (
                <>
                  <span className="mr-auto text-sm font-medium text-rose-700">Delete this message for good?</span>
                  <button type="button" onClick={() => setConfirmDel(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white">Keep</button>
                  <button type="button" disabled={busy} onClick={() => run(() => deleteMessage(open.id), true)} className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><FaTrashCan className="size-3" /> Delete</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setConfirmDel(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><FaTrashCan className="size-3" /> Delete</button>
                  {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
                  {open.status === "new" ? (
                    <button type="button" disabled={busy} onClick={() => run(() => setMessageHandled(open.id, true), true)} className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><FaCheck /> Mark as handled</button>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => run(() => setMessageHandled(open.id, false), true)} className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><FaRotateLeft className="size-3" /> Move back to New</button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
