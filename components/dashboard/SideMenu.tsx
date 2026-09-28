"use client";

// Dashboard menu for phones and small tablets: a navy panel that slides in from the left over a dimmed page.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";
import { FaBars, FaXmark, FaRightFromBracket, FaChevronRight } from "react-icons/fa6";
import { MdQrCode2 } from "react-icons/md";
import { logout } from "@/app/actions/auth";

export type SideLink = { href: string; label: string; Icon: IconType; hint?: string; children?: SideLink[] };

export default function SideMenu({ links, admin, name, email, avatarUrl }: { links: SideLink[]; admin: boolean; name: string; email: string; avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const tabParam = useSearchParams().get("tab");
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const home = admin ? "/admin" : "/dashboard";
  const isOn = (href: string) => {
    const [base, tab] = href.split("?tab=");
    if (tab) {
      const group = links.find((l) => l.children?.some((c) => c.href === href));
      return path.startsWith(base) && (tabParam ?? group?.children?.[0].href.split("?tab=")[1]) === tab;
    }
    return href === home ? path === href : path.startsWith(href);
  };
  let n = 0; // running index for the staggered slide-in

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path, tabParam]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    document.documentElement.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("[aria-current=page], a")?.focus();
    return () => { document.removeEventListener("keydown", esc); document.documentElement.style.overflow = ""; button.current?.focus(); };
  }, [open]);

  return (
    <>
      <button ref={button} type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="side-menu"
        className="grid size-10 shrink-0 place-items-center rounded-lg text-white transition hover:bg-white/10 md:hidden">
        <FaBars className="size-5" />
      </button>

      {mounted && createPortal(
        <div className="md:hidden" data-open={open || undefined}>
          <div onClick={() => setOpen(false)} aria-hidden
            className={`fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
          <div ref={panel} id="side-menu" role="dialog" aria-modal="true" aria-label="Dashboard menu" inert={!open}
            className={`fixed inset-y-0 left-0 z-[61] flex w-[84%] max-w-xs flex-col bg-blue-950 text-white shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 pl-4 pr-2">
              <Link href="/" className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-sm font-extrabold tracking-[0.08em]">
                <MdQrCode2 className="size-6 shrink-0 text-amber-300" /> GIVE ME FIVE STAR
                {admin && <span className="shrink-0 rounded bg-amber-300 px-1 py-0.5 text-[9px] font-bold tracking-wider text-blue-950">ADMIN</span>}
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 shrink-0 place-items-center rounded-lg text-blue-200 transition hover:bg-white/10 hover:text-white">
                <FaXmark className="size-5" />
              </button>
            </div>

            {/* who is signed in */}
            <div className="menu-item mx-4 mt-3 flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10" style={{ transitionDelay: open ? "60ms" : "0ms" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                : <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-300 font-bold text-blue-950">{initials}</span>}
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <p className="truncate text-xs text-blue-200">{email}</p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {/* main pages, then each section's pages (e.g. Settings) as their own items under a heading */}
              {[{ title: "Menu", items: links.filter((l) => !l.children) }, ...links.filter((l) => l.children).map((l) => ({ title: l.label, items: l.children! }))].map((group, g) => (
                <div key={group.title} className={g ? "mt-3" : ""}>
                  <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-300/70">{group.title}</p>
                  <ul className="space-y-0.5">
                    {group.items.map(({ href, label, Icon, hint }) => {
                      const on = isOn(href);
                      return (
                        <li key={href} className="menu-item" style={{ transitionDelay: open ? `${100 + (n++) * 30}ms` : "0ms" }}>
                          <Link href={href} aria-current={on ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${on ? "bg-white text-blue-950 shadow" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>
                            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${on ? "bg-blue-950 text-amber-300" : "bg-white/10"}`}><Icon className="size-3.5" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">{label}</span>
                              {hint && <span className={`block truncate text-xs ${on ? "text-slate-500" : "text-blue-300/80"}`}>{hint}</span>}
                            </span>
                            <FaChevronRight className={`size-3 ${on ? "text-blue-950" : "text-blue-300/50"}`} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <form action={logout} className="shrink-0 border-t border-white/10 p-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500 hover:text-white">
                <FaRightFromBracket className="size-4" /> Log out
              </button>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
