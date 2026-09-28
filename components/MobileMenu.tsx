"use client";

// Mobile menu: a panel that slides in from the right over a dimmed page.
// Rendered in a portal because the header's backdrop-blur would otherwise trap position:fixed.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaBars, FaXmark, FaWhatsapp, FaEnvelope, FaArrowRight, FaCircleQuestion } from "react-icons/fa6";
import { MdQrCode2 } from "react-icons/md";
import NavLink from "@/components/ui/NavLink";
import AuthButton from "@/components/auth/AuthButton";

type Props = {
  nav: { label: string; href: string }[];
  support: { phone: string; whatsapp: string; email: string; hours: string };
  dashboardHref: string | null;
};

export default function MobileMenu({ nav, support, dashboardHref }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    document.documentElement.style.overflow = "hidden"; // no page scroll behind the menu
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = "";
      button.current?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);
  const item = "flex items-center justify-between rounded-lg px-3 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50";

  return (
    <>
      <button ref={button} type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu"
        className="grid size-11 place-items-center rounded-lg text-slate-800 transition hover:bg-slate-100 lg:hidden">
        <FaBars className="size-6" />
      </button>

      {mounted && createPortal(
        <div className="lg:hidden" data-open={open || undefined}>
          {/* dimmed page */}
          <div onClick={close} aria-hidden
            className={`fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />

          <div ref={panel} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" inert={!open}
            className={`fixed inset-y-0 right-0 z-[61] flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
              <Link href="/" onClick={close} className="flex min-w-0 items-center gap-2 whitespace-nowrap text-base font-extrabold tracking-[0.08em] text-slate-900">
                <MdQrCode2 className="size-7 text-blue-900" /> GIVE ME FIVE STAR
              </Link>
              <button type="button" onClick={close} aria-label="Close menu" className="grid size-10 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <FaXmark className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {[...nav, { label: "Help Center", href: "/help" }].map((i, n) => (
                  <li key={i.label} className="menu-item" style={{ transitionDelay: open ? `${80 + n * 35}ms` : "0ms" }}>
                    <NavLink href={i.href} onClick={close} className={item}>
                      <span className="flex items-center gap-3">{i.label === "Help Center" && <FaCircleQuestion className="size-4 text-blue-700" />}{i.label}</span>
                      <FaArrowRight className="size-3 text-slate-300" />
                    </NavLink>
                  </li>
                ))}
              </ul>

              {(support.phone || support.email) && (
                <div className="menu-item mt-6 space-y-3 rounded-xl bg-slate-50 p-4" style={{ transitionDelay: open ? "380ms" : "0ms" }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Talk to us</p>
                  {support.phone && (
                    <a href={support.whatsapp || `tel:${support.phone}`} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                      <span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><FaWhatsapp className="size-4" /></span>
                      <span>{support.phone}{support.hours && <span className="block text-xs font-normal text-slate-500">{support.hours.replace(/^\(|\)$/g, "")}</span>}</span>
                    </a>
                  )}
                  {support.email && (
                    <a href={`mailto:${support.email}`} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                      <span className="grid size-9 place-items-center rounded-lg bg-blue-100 text-blue-800"><FaEnvelope className="size-3.5" /></span>
                      {support.email}
                    </a>
                  )}
                </div>
              )}
            </nav>

            <div className="shrink-0 border-t border-slate-100 p-4">
              {dashboardHref ? (
                <Link href={dashboardHref} onClick={close} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-3.5 font-semibold text-white">Dashboard <FaArrowRight className="size-3" /></Link>
              ) : (
                <div onClick={close}>
                  <AuthButton className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-3.5 font-semibold text-white">Get Started, it&apos;s free <FaArrowRight className="size-3" /></AuthButton>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
