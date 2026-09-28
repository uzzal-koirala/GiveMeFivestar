"use client";

import { useState } from "react";
import { FaShareNodes, FaFacebookF, FaInstagram, FaTiktok, FaGlobe, FaArrowRight, FaXmark } from "react-icons/fa6";

// Nudge to add website / social links; closing hides it until the next page load
export default function SocialReminder() {
  const [show, setShow] = useState(true);
  const later = () => setShow(false);
  if (!show) return null;

  return (
    <div role="status" className="notice-in flex flex-wrap items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm ring-2 ring-blue-200">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"><FaShareNodes className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900">Please set up your social media links</p>
        <p className="text-sm text-slate-600">
          Add your website, Facebook, Instagram or TikTok so happy customers can follow you straight from your review page.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center -space-x-1.5 sm:flex" aria-hidden>
          {[[FaGlobe, "bg-blue-700"], [FaFacebookF, "bg-[#1877F2]"], [FaInstagram, "bg-[#E4405F]"], [FaTiktok, "bg-black"]].map(([Icon, c], i) => {
            const I = Icon as typeof FaGlobe;
            return <span key={i} className={`grid size-7 place-items-center rounded-full text-white ring-2 ring-white ${c}`}><I className="size-3" /></span>;
          })}
        </span>
        <a href="/dashboard/settings?tab=business#social-links" className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
          Add links <FaArrowRight className="size-3" />
        </a>
        <button type="button" onClick={later} aria-label="Close" title="Close"
          className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
      </div>
    </div>
  );
}
