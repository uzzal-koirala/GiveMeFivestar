import Link from "next/link";
import NavLink from "@/components/ui/NavLink";
import {
  FaFacebook, FaLinkedin, FaInstagram, FaXTwitter, FaTiktok,
  FaWhatsapp, FaChevronDown, FaArrowRight, FaBars, FaLocationDot, FaStar, FaEnvelope,
} from "react-icons/fa6";
import { MdQrCode2 } from "react-icons/md";
import { site, nav, realLink } from "@/lib/site";
import { getPlatform } from "@/lib/platform";
import AuthButton from "@/components/auth/AuthButton";
import AuthDialog from "@/components/auth/AuthDialog";
import CookieBanner from "@/components/CookieBanner";
import MotionFx from "@/components/ui/MotionFx";
import MobileMenu from "@/components/MobileMenu";
import { getCurrentUser } from "@/lib/auth";

const socials = [
  { href: site.socials.facebook, label: "Facebook", Icon: FaFacebook },
  { href: site.socials.linkedin, label: "LinkedIn", Icon: FaLinkedin },
  { href: site.socials.instagram, label: "Instagram", Icon: FaInstagram },
  { href: site.socials.x, label: "X", Icon: FaXTwitter },
  { href: site.socials.tiktok, label: "TikTok", Icon: FaTiktok },
].filter((s) => realLink(s.href));

// Dropdown opens on hover and on keyboard focus (focus-within) — no JS needed
function Dropdown({ label, items, className = "", alignRight = false }: { label: string; items: { label: string; href: string }[]; className?: string; alignRight?: boolean }) {
  return (
    <div className="group relative">
      <button className={`flex items-center gap-2 py-2 ${className}`}>
        {label} <FaChevronDown className="size-3 transition group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div className={`invisible absolute ${alignRight ? "right-0" : "left-0"} top-full z-50 min-w-52 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100`}>
        <ul className="rounded-xl border border-slate-100 bg-white p-2 text-slate-700 shadow-xl">
          {items.map((i) => (
            <li key={i.label}>
              <NavLink href={i.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-800">
                {i.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default async function Header() {
  const [user, { support }] = await Promise.all([getCurrentUser(), getPlatform()]); // contact details the super admin set
  const supportItems = [
    { label: "Help Center", href: "/help" },
    { label: "Contact us", href: "/#contact" },
    ...(support.whatsapp ? [{ label: "WhatsApp chat", href: support.whatsapp }] : []),
    ...(support.email ? [{ label: "Email us", href: `mailto:${support.email}` }] : []),
  ];
  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-blue-950 text-white">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-4 px-4 text-sm">
          <div className="hidden flex-1 items-center gap-4 md:flex">
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} aria-label={label} className="opacity-90 hover:opacity-100">
                <Icon className="size-4" />
              </a>
            ))}
          </div>

          <p className="min-w-0 truncate text-center">
            Get more 5<FaStar className="inline size-3 -translate-y-px text-amber-300" /> Google reviews<span className="hidden sm:inline"> with AI</span>{" "}
            <AuthButton className="inline-flex items-center gap-1 font-medium text-amber-300 hover:text-amber-200">
              Start Free <FaArrowRight className="size-3" />
            </AuthButton>
          </p>

          <div className="hidden flex-1 items-center justify-end divide-x divide-white/30 md:flex">
            <span className="flex items-center gap-2 pr-4">
              <FaLocationDot className="size-3.5 text-red-400" /> {site.country}
            </span>
            <div className="pl-4">
              <Dropdown label="Support" items={supportItems} className="py-1" alignRight />
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="relative border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap text-lg font-extrabold tracking-[0.1em] text-slate-900 sm:text-xl xl:tracking-[0.15em]">
            <MdQrCode2 className="size-8 text-blue-900" />
            GIVE ME FIVE STAR
          </Link>

          <nav className="hidden items-center gap-4 text-[15px] font-medium text-slate-700 lg:flex xl:gap-7">
            {nav.map((item) => (
              <NavLink key={item.label} href={item.href} className="whitespace-nowrap py-2 hover:text-blue-800">{item.label}</NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-6 lg:flex xl:gap-8">
            {support.phone && (
              <a href={support.whatsapp || `tel:${support.phone}`} className="hidden items-center gap-2 xl:flex">
                <FaWhatsapp className="size-7 text-green-500" />
                <span className="leading-tight">
                  <span className="block font-semibold text-slate-800">{support.phone}</span>
                  {support.hours && <span className="block text-[11px] text-slate-500">{support.hours}</span>}
                </span>
              </a>
            )}
            {user ? (
              <Link href={user.role === "super_admin" ? "/admin" : "/dashboard"} className="whitespace-nowrap rounded-lg bg-blue-900 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-800">Dashboard</Link>
            ) : (
              <AuthButton className="whitespace-nowrap rounded-lg bg-blue-900 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-800">Get Started</AuthButton>
            )}
          </div>

          <MobileMenu nav={nav} support={support} dashboardHref={user ? (user.role === "super_admin" ? "/admin" : "/dashboard") : null} />
        </div>
      </div>
      <AuthDialog />
      <CookieBanner />
      <MotionFx />
    </header>
  );
}
