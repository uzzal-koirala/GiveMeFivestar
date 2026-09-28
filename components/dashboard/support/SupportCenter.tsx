"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaWhatsapp, FaEnvelope, FaPhone, FaPlus, FaMagnifyingGlass, FaArrowLeft, FaPaperPlane, FaPaperclip, FaCircleCheck, FaRotateLeft,
  FaInbox, FaHeadset, FaChevronDown, FaTicket, FaHourglassHalf, FaCircleDot,
} from "react-icons/fa6";
import { site } from "@/lib/site";
import type { SupportContact } from "@/lib/platform";
import type { Ticket, TicketStatus } from "@/lib/types";
import NewTicketDialog, { type NewTicket, type TicketDraft } from "./NewTicketDialog";
import { STATUS, PRIORITY } from "./ticketStyles";
import { createTicket, replyTicket, setTicketStatus } from "@/app/actions/support";
import { setTicketStatusAdmin, staffReply } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

const FILTERS = ["all", "open", "in_progress", "resolved"] as const; // "resolved" also shows closed tickets
const STEPS: TicketStatus[] = ["open", "in_progress", "resolved"];
const card = "rounded-xl border border-slate-200 bg-white shadow-sm";

// Pre-filled tickets opened from elsewhere, e.g. /dashboard/support?new=google-link
const DRAFTS: Record<string, TicketDraft> = {
  "google-link": { category: "Google link change", subject: "Change my Google review link", body: "Please update my Google review link to: " },
  downgrade: { category: "Billing & payments", subject: "Downgrade my plan", body: "I'd like to downgrade my plan to: " },
};

const FAQ = [
  { q: "How long does it take to get a reply?", a: `We usually reply within a few hours during working hours ${site.phoneHours}. Urgent tickets are answered first.` },
  { q: "How do I change my Google review link?", a: "For safety, the link is locked after it’s set. Raise a ticket under “Google link change” with the new link and we’ll update it for you." },
  { q: "My payment proof is still being verified. What should I do?", a: "Verification normally takes a few hours. If it’s been longer, reply on your ticket or raise a new one with your transaction ID." },
  { q: "When will my ad start?", a: "Ads usually start within 24 to 48 hours after your payment is approved. Reviews then arrive gradually." },
];

const when = (iso: string) => {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const stamp = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function StatusBadge({ status }: { status: TicketStatus }) {
  const { label, Icon, cls } = STATUS[status];
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}><Icon className="size-2.5" /> {label}</span>;
}

// admin = super admin view: every business's tickets, reply as support, set any status
export default function SupportCenter({ initial, admin = false, open, contact }: { initial: Ticket[]; admin?: boolean; open?: string; contact?: SupportContact }) {
  const c = contact ?? { email: site.supportEmail, phone: site.phone, whatsapp: site.whatsapp, hours: site.phoneHours };
  const router = useRouter();
  const [tickets, setTickets] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.some((t) => t.id === open) ? open! : initial[0]?.id ?? null);
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // open a ticket; on phones the list is swapped for the conversation, so bring it into view
  const openTicket = (id: string) => {
    setSelectedId(id);
    setShowDetailOnMobile(true);
    if (innerWidth < 1024) setTimeout(() => box.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 50);
  };
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [reply, setReply] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<TicketDraft>({});
  const [dialogKey, setDialogKey] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;
  const shown = tickets
    .filter((t) => (filter === "all" || t.status === filter || (filter === "resolved" && t.status === "closed")) && (!q || `${t.code} ${t.subject} ${t.category}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;


  function openNew(d: TicketDraft = {}) {
    setDraft(d);
    setDialogKey((k) => k + 1);
    // wait for the re-mounted dialog before opening it
    requestAnimationFrame(() => dialog.current?.showModal());
  }

  // ?new=google-link opens a pre-filled ticket
  useEffect(() => {
    const d = DRAFTS[new URLSearchParams(location.search).get("new") ?? ""];
    if (d) openNew(d);
  }, []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // put the server's copy of a ticket into the list (new or updated)
  const upsert = (t: Ticket) => setTickets((all) => [t, ...all.filter((x) => x.id !== t.id)]);
  useEffect(() => setTickets(initial), [initial]); // admin actions refresh the server data

  async function create(n: NewTicket) {
    const data = new FormData();
    data.set("subject", n.subject);
    data.set("category", n.category);
    data.set("priority", n.priority);
    data.set("body", n.body);
    if (n.attachment) data.set("attachment", n.attachment);
    const res = await createTicket(data);
    if (res.error || !res.ticket) return setError(res.error ?? "Couldn’t create the ticket. Please try again.");
    setError("");
    upsert(res.ticket);
    setFilter("all");
    openTicket(res.ticket.id);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim() || busy) return;
    if (admin) {
      setBusy(true);
      const res = await staffReply(selected.id, reply);
      setBusy(false);
      if (res.error) return setError(res.error);
      setError("");
      setReply("");
      return router.refresh();
    }
    const data = new FormData();
    data.set("ticketId", selected.id);
    data.set("body", reply.trim());
    if (replyFile) data.set("attachment", replyFile);
    setBusy(true);
    const res = await replyTicket(data);
    setBusy(false);
    if (res.error || !res.ticket) return setError(res.error ?? "Couldn’t send your reply. Please try again.");
    setError("");
    upsert(res.ticket);
    setReply("");
    setReplyFile(null);
  }

  async function setStatus(status: TicketStatus) {
    if (!selected) return;
    if (admin) {
      const res = await setTicketStatusAdmin(selected.id, status);
      if (res.error) return setError(res.error);
      setError("");
      return router.refresh();
    }
    const res = await setTicketStatus(selected.id, status);
    if (res.error || !res.ticket) return setError(res.error ?? "Couldn’t update the ticket.");
    setError("");
    upsert(res.ticket);
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="mt-1 text-blue-200">{admin ? "Tickets from every business. Reply as Give Me Five Star Support." : "We’re here to help. Raise a ticket or reach us directly."}</p>
        </div>
        <button type="button" hidden={admin} onClick={() => openNew()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-blue-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-200 sm:w-auto sm:py-2.5">
          <FaPlus className="size-3" /> New ticket
        </button>
      </div>

      {/* Stats + contact */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Open", value: count("open"), Icon: FaCircleDot, tint: "bg-blue-100 text-blue-800" },
          { label: "In progress", value: count("in_progress"), Icon: FaHourglassHalf, tint: "bg-amber-100 text-amber-700" },
          { label: "Resolved", value: count("resolved") + count("closed"), Icon: FaCircleCheck, tint: "bg-emerald-100 text-emerald-700" },
        ].map(({ label, value, Icon, tint }) => (
          <div key={label} className={`${card} flex flex-col items-center gap-1.5 p-2.5 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:text-left`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg sm:size-12 ${tint}`}><Icon className="size-3.5 sm:size-5" /></span>
            <div className="flex flex-col-reverse sm:block">
              <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">{label}</p>
              <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
            </div>
          </div>
        ))}
        <div className={`${card} flex flex-col items-center gap-1.5 p-2.5 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:text-left`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700 sm:size-12"><FaTicket className="size-3.5 sm:size-5" /></span>
          <div className="flex flex-col-reverse sm:block">
            <p className="text-[11px] leading-tight text-slate-500 sm:text-sm"><span className="sm:hidden">Total</span><span className="hidden sm:inline">Total tickets</span></p>
            <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{tickets.length}</p>
          </div>
        </div>
      </div>

      {/* phones: reach us without scrolling to the bottom */}
      {!admin && (
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          {[
            { href: c.whatsapp, label: "WhatsApp", Icon: FaWhatsapp, cls: "text-emerald-600" },
            { href: c.phone && `tel:${c.phone}`, label: "Call", Icon: FaPhone, cls: "text-blue-800" },
            { href: c.email && `mailto:${c.email}`, label: "Email", Icon: FaEnvelope, cls: "text-blue-700" },
          ].filter((x) => x.href).map(({ href, label, Icon, cls }) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
              <Icon className={`size-4 ${cls}`} /> {label}
            </a>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
          <button type="button" onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">Dismiss</button>
        </p>
      )}

      {/* Tickets: list + detail */}
      <div ref={box} className={`${card} scroll-mt-20 grid grid-cols-1 overflow-hidden lg:min-h-[560px] lg:grid-cols-[360px_minmax(0,1fr)]`}>
        {/* List */}
        <div className={`min-w-0 flex-col border-slate-100 lg:flex lg:border-r ${showDetailOnMobile ? "hidden" : "flex"}`}>
          <div className="space-y-3 border-b border-slate-100 p-4">
            <label className="relative block">
              <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets" aria-label="Search tickets"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </label>
            <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto">
              {FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
                  {f === "all" ? "All" : STATUS[f].label}
                </button>
              ))}
            </div>
          </div>

          <ul className="no-scrollbar flex-1 divide-y divide-slate-100 overflow-y-auto lg:max-h-[560px]">
            {shown.map((t) => {
              const active = t.id === selectedId;
              const last = t.messages.at(-1)!;
              return (
                <li key={t.id}>
                  <button type="button" onClick={() => openTicket(t.id)}
                    className={`block w-full border-l-4 px-4 py-4 text-left transition ${active ? "border-blue-900 bg-blue-50/50" : "border-transparent hover:bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400">{t.code}</span>
                      <span suppressHydrationWarning className="text-xs text-slate-400">{when(t.updatedAt)}</span>
                    </div>
                    <p className="mt-1 truncate font-semibold text-slate-900">{t.subject}</p>
                    {t.business && <p className="truncate text-xs font-semibold text-blue-800">{t.business}</p>}
                    <p className="mt-0.5 truncate text-sm text-slate-500">{last.from === "support" ? "Support: " : "You: "}{last.body}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      {t.priority === "urgent" && <span className="flex items-center gap-1 text-xs font-semibold text-rose-600"><PRIORITY.urgent.Icon className="size-2.5" /> Urgent</span>}
                    </div>
                  </button>
                </li>
              );
            })}
            {!shown.length && (
              <li className="grid place-items-center px-6 py-16 text-center">
                <FaInbox className="size-8 text-slate-200" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No tickets here</p>
                <p className="text-xs text-slate-500">Try another filter or raise a new ticket.</p>
              </li>
            )}
          </ul>
        </div>

        {/* Detail */}
        <div className={`min-w-0 flex-col lg:flex ${showDetailOnMobile ? "flex" : "hidden"}`}>
          {selected ? (
            <>
              <div className="border-b border-slate-100 p-5 sm:px-6">
                <button type="button" onClick={() => setShowDetailOnMobile(false)} className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 lg:hidden">
                  <FaArrowLeft className="size-3" /> All tickets
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{selected.code}</span>
                      {selected.business && <span className="font-semibold text-blue-800">{selected.business}</span>}
                      <span>{selected.category}</span>
                      <span className="flex items-center gap-1"><PRIORITY.normal.Icon className={`size-2.5 ${PRIORITY[selected.priority].dot}`} /> {PRIORITY[selected.priority].label} priority</span>
                      <span>Opened {stamp(selected.createdAt)}</span>
                    </p>
                  </div>
                  {admin ? (
                    <select value={selected.status} onChange={(e) => setStatus(e.target.value as TicketStatus)} aria-label="Ticket status"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600">
                      {(Object.keys(STATUS) as TicketStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                    </select>
                  ) : selected.status === "resolved" || selected.status === "closed" ? (
                    <button type="button" onClick={() => setStatus("open")} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      <FaRotateLeft className="size-3" /> Reopen
                    </button>
                  ) : (
                    <button type="button" onClick={() => setStatus("resolved")} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                      <FaCircleCheck className="size-3" /> Mark resolved
                    </button>
                  )}
                </div>

                {/* Progress */}
                <ol className="mt-5 flex items-center">
                  {STEPS.map((s, i) => {
                    const reached = STEPS.indexOf(selected.status === "closed" ? "resolved" : selected.status) >= i;
                    return (
                      <li key={s} className="flex flex-1 items-center last:flex-none">
                        <span className={`flex items-center gap-2 text-xs font-semibold ${reached ? "text-blue-900" : "text-slate-400"}`}>
                          <span className={`grid size-6 place-items-center rounded-full ${reached ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {reached ? <FaCircleCheck className="size-3" /> : i + 1}
                          </span>
                          <span className="hidden sm:inline">{i === 0 ? "Submitted" : STATUS[s].label}</span>
                        </span>
                        {i < STEPS.length - 1 && <span className={`mx-3 h-0.5 flex-1 rounded-full ${STEPS.indexOf(selected.status === "closed" ? "resolved" : selected.status) > i ? "bg-blue-900" : "bg-slate-200"}`} />}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Thread */}
              <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-5 sm:p-6 lg:max-h-[420px]">
                {selected.messages.map((m, i) => {
                  const mine = admin ? m.from === "support" : m.from === "you";
                  return (
                    <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${mine ? "bg-amber-300 text-blue-950" : "bg-blue-900 text-white"}`}>
                        {m.from === "you" ? m.name.split(" ").map((w) => w[0]).join("").slice(0, 2) : <FaHeadset className="size-4" />}
                      </span>
                      <div className={`max-w-[80%] ${mine ? "text-right" : ""}`}>
                        <p className="text-xs text-slate-500"><b className="font-semibold text-slate-700">{mine ? "You" : m.name}</b> · {stamp(m.at)}</p>
                        <div className={`mt-1 inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed ${mine ? "rounded-tr-sm bg-blue-900 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"}`}>
                          {m.body}
                          {m.attachment && (
                            <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer"
                              className={`mt-2 flex items-center gap-1.5 text-xs font-medium underline-offset-2 hover:underline ${mine ? "text-blue-200" : "text-slate-500"}`}>
                              <FaPaperclip className="size-3" /> {m.attachment}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {selected.status === "resolved" && (
                  <p className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-700"><FaCircleCheck /> Marked as resolved. Reply below if you still need help.</p>
                )}
              </div>

              {/* Reply */}
              {selected.status === "closed" ? (
                <p className="border-t border-slate-100 p-5 text-center text-sm text-slate-500">This ticket is closed. Reopen it to send a reply.</p>
              ) : (
                <form onSubmit={send} className="border-t border-slate-100 p-4">
                  <div className="rounded-lg border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Write a reply…" aria-label="Reply"
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e); }}
                      className="block w-full resize-none rounded-t-lg bg-transparent px-4 pt-3 text-sm outline-none placeholder:text-slate-400" />
                    <div className="flex items-center justify-between gap-2 px-2 pb-2">
                      <label hidden={admin} className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                        <FaPaperclip className="shrink-0" /> <span className="truncate">{replyFile ? replyFile.name : "Attach"}</span>
                        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { setReplyFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                      </label>
                      <button disabled={!reply.trim() || busy} className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-40">
                        <FaPaperPlane className="size-3" /> Send
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 hidden text-right text-[11px] text-slate-400 sm:block">Ctrl + Enter to send</p>
                </form>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-10 text-center">
              <div>
                <FaTicket className="mx-auto size-10 text-slate-200" />
                <p className="mt-3 font-semibold text-slate-700">Select a ticket</p>
                <p className="text-sm text-slate-500">Or raise a new one if you need help.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <section hidden={admin} className={`${card} p-5 sm:p-8`}>
        <h2 className="text-lg font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                {q}
                <FaChevronDown className="size-3 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4 sm:px-5">
          <div>
            <p className="font-semibold text-slate-800">Still need help?</p>
            <p className="text-xs text-slate-500">Talk to us directly {c.hours}</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {[
              { href: c.whatsapp, label: "WhatsApp", Icon: FaWhatsapp, cls: "text-emerald-600" },
              { href: c.email && `mailto:${c.email}`, label: "Email", Icon: FaEnvelope, cls: "text-blue-700" },
              { href: c.phone && `tel:${c.phone}`, label: "Call", Icon: FaPhone, cls: "text-slate-700" },
            ].filter((x) => x.href).map(({ href, label, Icon, cls }) => (
              <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:shadow-sm sm:px-3.5 sm:py-2">
                <Icon className={`size-3.5 ${cls}`} /> {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <NewTicketDialog key={dialogKey} ref={dialog} draft={draft} onSubmit={create} />
    </div>
  );
}
