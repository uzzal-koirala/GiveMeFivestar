"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaGear, FaRightFromBracket, FaChevronDown, FaHeadset } from "react-icons/fa6";
import { logout } from "@/app/actions/auth";

export default function ProfileMenu({ base, name, email, avatarUrl }: { base: string; name: string; email: string; avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  // close on outside click, Esc, or navigation
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => setOpen(false), [path]);

  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";
  const Avatar = ({ size }: { size: string }) =>
    avatarUrl ? (
      <img src={avatarUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
    ) : (
      <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-amber-300 text-sm font-bold text-blue-950`}>{initials}</span>
    );

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex items-center gap-2 rounded-full p-0.5 transition sm:pr-2 hover:bg-white/10 ${open ? "bg-white/10" : ""}`}
      >
        <Avatar size="size-9" />
        <FaChevronDown className={`hidden size-3 text-blue-200 transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="filter-pop absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-1.5 text-slate-700 shadow-2xl shadow-slate-900/15">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar size="size-10" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <Link role="menuitem" href={`${base}/settings`} className={`${item} hover:bg-slate-50 hover:text-slate-900`}>
            <FaGear className="size-4 text-slate-400" /> Settings
          </Link>
          <Link role="menuitem" href={`${base}/support`} className={`${item} hover:bg-slate-50 hover:text-slate-900`}>
            <FaHeadset className="size-4 text-slate-400" /> Help & support
          </Link>
          <form action={logout}>
            <button role="menuitem" className={`${item} text-rose-600 hover:bg-rose-50`}>
              <FaRightFromBracket className="size-4" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
