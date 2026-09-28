// Site footer for the public pages
import Link from "next/link";
import NavLink from "@/components/ui/NavLink";
import { MdQrCode2 } from "react-icons/md";
import {
  FaFacebook, FaLinkedin, FaInstagram, FaXTwitter, FaTiktok, FaWhatsapp, FaEnvelope, FaClock, FaLocationDot, FaWallet, FaBuildingColumns, FaHeart,
} from "react-icons/fa6";
import { site, realLink, isBank } from "@/lib/site";
import { getPlatform } from "@/lib/platform";

const socials = [
  { href: site.socials.facebook, label: "Facebook", Icon: FaFacebook },
  { href: site.socials.instagram, label: "Instagram", Icon: FaInstagram },
  { href: site.socials.tiktok, label: "TikTok", Icon: FaTiktok },
  { href: site.socials.linkedin, label: "LinkedIn", Icon: FaLinkedin },
  { href: site.socials.x, label: "X", Icon: FaXTwitter },
].filter((s) => realLink(s.href));

// Grouped footer links: every one points to a real page or home-page section
const COLUMNS = [
  { title: "Product", links: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Solutions", href: "/#solutions" },
    { label: "Pricing", href: "/#pricing" },
  ] },
  { title: "Company", links: [
    { label: "About us", href: "/#about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Contact us", href: "/#contact" },
  ] },
  { title: "Resources", links: [
    { label: "Help Center", href: "/help" },
    { label: "Review Guidelines", href: "/review-guidelines" },
    { label: "Get more reviews", href: "/blog/7-easy-ways-to-get-more-google-reviews-in-nepal" },
  ] },
  { title: "Legal", links: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Data We Collect", href: "/data-we-collect" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refund-policy" },
  ] },
];

export default async function Footer() {
  const { support, methods } = await getPlatform(); // contact details the super admin set
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-blue-950 text-blue-100/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_2.4fr_1.2fr]">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-[0.15em] text-white">
            <MdQrCode2 className="size-8 text-amber-300" /> GIVE ME FIVE STAR
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Helping local businesses worldwide turn happy customers into 5-star Google reviews with one QR code and a little AI.
          </p>
          {socials.length > 0 && <div className="mt-6 flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} aria-label={label} title={label}
                className="grid size-9 place-items-center rounded-full bg-white/5 text-blue-100 ring-1 ring-white/10 transition hover:bg-amber-300 hover:text-blue-950 hover:ring-amber-300">
                <Icon className="size-3.5" />
              </a>
            ))}
          </div>}
        </div>

        {/* Links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-bold text-white">{col.title}</p>
              <ul className="mt-3 space-y-1.5 text-sm sm:mt-4 sm:space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <NavLink href={l.href} className="inline-block py-1 transition hover:text-amber-300 sm:py-0">{l.label}</NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Contact */}
        <div className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-sm font-bold text-white">Talk to us</p>
          <ul className="mt-4 space-y-3.5 text-sm">
            {support.whatsapp && (
              <li>
                <a href={support.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 transition hover:text-white">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400"><FaWhatsapp className="size-4" /></span>
                  <span><span className="block font-semibold text-white">{support.phone || "WhatsApp"}</span><span className="text-xs">Chat on WhatsApp</span></span>
                </a>
              </li>
            )}
            {support.email && (
              <li>
                <a href={`mailto:${support.email}`} className="flex items-center gap-3 transition hover:text-white">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300"><FaEnvelope className="size-3.5" /></span>
                  <span className="break-all">{support.email}</span>
                </a>
              </li>
            )}
            {support.hours && (
              <li className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300"><FaClock className="size-3.5" /></span>
                {support.hours.replace(/^\(|\)$/g, "")}
              </li>
            )}
            <li className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300"><FaLocationDot className="size-3.5" /></span>
              Kathmandu, {site.country}
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-xs sm:flex-row sm:justify-between">
          <p className="flex items-center gap-1.5">
            © {year} {site.name}. Made with <FaHeart className="size-3 text-rose-400" aria-label="love" /> in {site.country}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-blue-200/60">We accept</span>
            {methods.filter((m) => m.enabled).map((m) => (
              <span key={m.id} className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 font-semibold text-blue-100 ring-1 ring-white/10">
                {isBank(m) ? <FaBuildingColumns className="size-3" /> : <FaWallet className="size-3" />} {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
