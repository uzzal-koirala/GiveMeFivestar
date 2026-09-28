"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";
import { FaWandMagicSparkles, FaCrown, FaLock, FaChevronDown, FaEllipsis, FaChartPie, FaUsers, FaGear, FaUserShield, FaQrcode, FaEnvelope, FaNewspaper, FaStar, FaBullhorn, FaHeadset, FaStore, FaMoneyCheckDollar } from "react-icons/fa6";
import { MdQrCode2 } from "react-icons/md";
import ProfileMenu from "./ProfileMenu";
import SideMenu from "./SideMenu";

const LINKS = {
  owner: [
    { href: "/dashboard", label: "Overview", Icon: FaChartPie },
    { href: "/dashboard/reviews", label: "Reviews", Icon: FaStar },
    { href: "/dashboard/customers", label: "Customers", Icon: FaUsers },
    { href: "/dashboard/ads", label: "Ads", Icon: FaBullhorn },
    { href: "/dashboard/support", label: "Support", Icon: FaHeadset },
    { href: "/dashboard/settings", label: "Settings", Icon: FaGear },
  ],
  admin: [
    { href: "/admin", label: "Overview", Icon: FaChartPie },
    { href: "/admin/businesses", label: "Businesses", Icon: FaStore },
    { href: "/admin/payments", label: "Payments", Icon: FaMoneyCheckDollar },
    { href: "/admin/ads", label: "Ads", Icon: FaBullhorn },
    { href: "/admin/stands", label: "Stands", Icon: FaQrcode },
    { href: "/admin/support", label: "Support", Icon: FaHeadset },
  ],
};
// phone side menu: Settings opens into its tabs
type DropItem = { href: string; label: string; Icon: IconType; hint?: string };
const SETTINGS_TABS: DropItem[] = [
  { href: "/dashboard/settings?tab=business", label: "Business", Icon: FaStore, hint: "Profile, business details, review page" },
  { href: "/dashboard/settings?tab=ai", label: "AI Reviews", Icon: FaWandMagicSparkles, hint: "Tone, language, keywords, credits" },
  { href: "/dashboard/settings?tab=subscription", label: "Subscription", Icon: FaCrown, hint: "Your plan and upgrades" },
  { href: "/dashboard/settings?tab=stand", label: "QR Stand", Icon: FaQrcode, hint: "Order a printed QR stand" },
  { href: "/dashboard/settings?tab=security", label: "Security", Icon: FaLock, hint: "Email and password" },
];
// no one-line descriptions in the phone menu, so Settings items look like the rest
const OWNER_SIDE = LINKS.owner.map((l) => l.href !== "/dashboard/settings" ? l : { ...l, children: SETTINGS_TABS.map(({ hint: _, ...t }) => t) });

// admin pages grouped under "Others" so the bar stays short
const ADMIN_OTHERS = [
  { href: "/admin/messages", label: "Messages", Icon: FaEnvelope, hint: "Contact form & job applications" },
  { href: "/admin/content", label: "Content", Icon: FaNewspaper, hint: "Testimonials, logos, careers, blog" },
  { href: "/admin/users", label: "Users", Icon: FaUserShield, hint: "Admin accounts" },
  { href: "/admin/settings", label: "Settings", Icon: FaGear, hint: "Prices, payments, AI" },
];

function NavDropdown({ path, label, Icon: TriggerIcon, items, isActive }: { path: string; label: string; Icon: IconType; items: DropItem[]; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const active = isActive;
  const tab = useSearchParams().get("tab");
  useEffect(() => setOpen(false), [path, tab]); // close after navigating
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label={label} title={label}
        className={`flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium transition sm:px-3 lg:gap-1.5 ${active ? "bg-white text-blue-950 shadow" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>
        <TriggerIcon className="size-3.5" />
        <span className="hidden lg:inline">{label}</span>
        <FaChevronDown className={`hidden size-2.5 transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="tab-fade absolute right-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-1.5 text-slate-800 shadow-xl ring-1 ring-slate-200">
          {items.map(({ href, label, Icon, hint }) => {
            const [base, q] = href.split("?tab=");
            const on = q ? path.startsWith(base) && (tab ?? items[0].href.split("?tab=")[1]) === q : path.startsWith(href);
            return (
              <Link key={href} href={href} role="menuitem" aria-current={on ? "page" : undefined} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${on ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${on ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="size-3.5" /></span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${on ? "text-blue-900" : ""}`}>{label}</span>
                  <span className="block truncate text-xs text-slate-500">{hint}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TopNav({ variant, ownerName, email, avatarUrl }: { variant: "owner" | "admin"; ownerName: string; email: string; avatarUrl: string | null }) {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-blue-950 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <SideMenu links={variant === "admin" ? [...LINKS.admin, ...ADMIN_OTHERS] : OWNER_SIDE} admin={variant === "admin"} name={ownerName} email={email} avatarUrl={avatarUrl} />
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-extrabold tracking-[0.1em] max-md:mr-auto xl:tracking-[0.15em]">
          <MdQrCode2 className="size-7 text-amber-300" />
          <span className={variant === "admin" ? "max-md:inline hidden xl:inline" : "max-md:inline hidden lg:inline"}>GIVE ME FIVE STAR</span>
          {variant === "admin" && <span className="hidden rounded-md bg-amber-300 px-1.5 py-0.5 text-[10px] sm:inline font-bold tracking-wider text-blue-950">ADMIN</span>}
        </Link>

        <nav className={`hidden min-w-0 gap-0.5 rounded-full bg-white/10 p-1 sm:gap-1 md:flex `}>
          {LINKS[variant].filter((l) => l.href !== "/dashboard/settings").map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              aria-label={label}
              title={label}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 text-sm font-medium transition ${variant === "admin" ? "px-2 sm:px-3 lg:gap-1.5" : "px-3 lg:px-4"} ${path === href ? "bg-white text-blue-950 shadow" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="size-3.5" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
          {variant === "admin"
            ? <NavDropdown path={path} label="Others" Icon={FaEllipsis} items={ADMIN_OTHERS} isActive={ADMIN_OTHERS.some((l) => path.startsWith(l.href))} />
            : <NavDropdown path={path} label="Settings" Icon={FaGear} items={SETTINGS_TABS} isActive={path.startsWith("/dashboard/settings")} />}
        </nav>

        <ProfileMenu base={variant === "admin" ? "/admin" : "/dashboard"} name={ownerName} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
