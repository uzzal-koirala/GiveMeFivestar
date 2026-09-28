"use client";

import { useState } from "react";
import Link from "next/link";
import { FaReceipt, FaBullhorn, FaTicket, FaInbox } from "react-icons/fa6";
import { npr } from "@/components/ui/PaymentMethods";
import { StatusBadge, fmtDate } from "./ui";

type Payment = { id: string; title: string; amount: number; status: string; date: string };
type Ad = { id: string; title: string; delivered: number; reviews: number; amount: number; status: string; date: string };
type TicketRow = { id: string; subject: string; category: string; status: string; messages: number; date: string };

const TICKET_STATUS: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center py-12 text-center">
      <FaInbox className="size-7 text-slate-200" />
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

// Tabs with this business's payments, ads and tickets
export default function BusinessActivity({ payments, ads, tickets }: { payments: Payment[]; ads: Ad[]; tickets: TicketRow[] }) {
  const TABS = [
    { id: "payments", label: "Payments", Icon: FaReceipt, count: payments.length },
    { id: "ads", label: "Ads", Icon: FaBullhorn, count: ads.length },
    { id: "tickets", label: "Tickets", Icon: FaTicket, count: tickets.length },
  ] as const;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("payments");

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div role="tablist" className="grid grid-cols-3 gap-1 border-b border-slate-100 p-2 sm:flex">
        {TABS.map(({ id, label, Icon, count }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold transition sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${tab === id ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            <Icon className="size-3.5" /> {label}
            <span className={`rounded-full px-1.5 text-xs ${tab === id ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{count}</span>
          </button>
        ))}
      </div>

      <div key={tab} className="tab-fade max-h-[520px] overflow-y-auto no-scrollbar">
        {tab === "payments" && (payments.length ? (
          <ul className="divide-y divide-slate-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{fmtDate(p.date)}</p>
                </div>
                <span className="font-bold text-slate-900">{npr(p.amount)}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
            <li className="px-5 py-3 text-right"><Link href="/admin/payments" className="text-sm font-semibold text-blue-700 hover:underline">Review payments</Link></li>
          </ul>
        ) : <Empty text="No payments yet." />)}

        {tab === "ads" && (ads.length ? (
          <ul className="divide-y divide-slate-100">
            {ads.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">{a.title}</p>
                  <span className="font-bold text-slate-900">{npr(a.amount)}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(a.delivered / a.reviews) * 100}%` }} /></div>
                  <span className="text-xs text-slate-500">{a.delivered}/{a.reviews} · {fmtDate(a.date)}</span>
                </div>
              </li>
            ))}
            <li className="px-5 py-3 text-right"><Link href="/admin/ads" className="text-sm font-semibold text-blue-700 hover:underline">Manage ads</Link></li>
          </ul>
        ) : <Empty text="No ads yet." />)}

        {tab === "tickets" && (tickets.length ? (
          <ul className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.category} · {t.messages} message{t.messages === 1 ? "" : "s"} · {fmtDate(t.date)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{TICKET_STATUS[t.status] ?? t.status}</span>
              </li>
            ))}
            <li className="px-5 py-3 text-right"><Link href="/admin/support" className="text-sm font-semibold text-blue-700 hover:underline">Open support</Link></li>
          </ul>
        ) : <Empty text="No support tickets." />)}
      </div>
    </section>
  );
}
