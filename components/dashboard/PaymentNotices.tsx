"use client";

import { useState, useTransition } from "react";
import { FaCircleCheck, FaXmark, FaCrown, FaBolt, FaBullhorn } from "react-icons/fa6";
import { dismissPaymentNotice } from "@/app/actions/notices";

export type PaymentNotice = { id: string; source: "payment" | "ad"; kind: "plan" | "topup" | "ad"; title: string; text: string };

const ICON = { plan: FaCrown, topup: FaBolt, ad: FaBullhorn };

// "Your payment is approved" cards at the top of the dashboard; closing one is remembered on the server
export default function PaymentNotices({ notices }: { notices: PaymentNotice[] }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [, start] = useTransition();
  const shown = notices.filter((n) => !hidden.includes(n.id));
  if (!shown.length) return null;

  const close = (n: PaymentNotice) => {
    setHidden((h) => [...h, n.id]); // hide right away
    start(() => dismissPaymentNotice(n.source, n.id));
  };

  return (
    <>
      {shown.map((n) => {
        const Icon = ICON[n.kind];
        return (
          <div key={n.id} role="status" className="notice-in flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm ring-2 ring-emerald-300">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Icon className="size-4" />
              <FaCircleCheck className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-white text-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">{n.title}</p>
              <p className="text-sm text-slate-600">{n.text}</p>
            </div>
            <button type="button" onClick={() => close(n)} aria-label="Close notification" title="Close"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <FaXmark />
            </button>
          </div>
        );
      })}
    </>
  );
}
