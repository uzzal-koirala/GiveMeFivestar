"use client";

import { useEffect, useState } from "react";
import { FaCookieBite, FaXmark, FaLock, FaChartSimple, FaChevronDown } from "react-icons/fa6";

const KEY = "cookie-consent"; // "all" | "essential"

// Cookie notice for the public pages. The only cookie we set today is the sign-in session;
// the choice is saved so any future analytics can check it before loading.
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    if (saved) return;
    const t = setTimeout(() => setShow(true), 800); // let the page settle first
    return () => clearTimeout(t);
  }, []);

  const choose = (v: "all" | "essential") => {
    try { localStorage.setItem(KEY, v); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-text"
      className="cookie-in fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[420px]">
      <div className="rounded-xl bg-white p-5 shadow-2xl shadow-blue-950/25 ring-1 ring-slate-200">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><FaCookieBite className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p id="cookie-title" className="font-bold text-slate-900">We use cookies</p>
            <p id="cookie-text" className="mt-1 text-sm leading-relaxed text-slate-600">
              We use a few cookies to keep you signed in and make the site work. No advertising or tracking cookies.
            </p>
          </div>
          <button type="button" onClick={() => choose("essential")} aria-label="Close and keep essential cookies only"
            className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <FaXmark />
          </button>
        </div>

        <button type="button" onClick={() => setDetails(!details)} aria-expanded={details}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:underline">
          {details ? "Hide details" : "What we use"} <FaChevronDown className={`size-2.5 transition ${details ? "rotate-180" : ""}`} />
        </button>
        {details && (
          <ul className="tab-fade mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <FaLock className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              <span className="min-w-0 flex-1"><b className="text-slate-800">Essential</b><span className="block text-xs text-slate-500">Keeps you signed in and your account secure.</span></span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Always on</span>
            </li>
            <li className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <FaChartSimple className="mt-0.5 size-3.5 shrink-0 text-blue-700" />
              <span className="min-w-0 flex-1"><b className="text-slate-800">Analytics</b><span className="block text-xs text-slate-500">Helps us see which pages are useful. Only with &ldquo;Accept all&rdquo;.</span></span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Optional</span>
            </li>
          </ul>
        )}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => choose("essential")}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Essential only
          </button>
          <button type="button" onClick={() => choose("all")}
            className="flex-1 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
