// Cookie policy: matches what the site actually stores (sign-in cookie + the cookie choice itself)
import type { Metadata } from "next";
import Link from "next/link";
import { FaCookieBite, FaBan, FaSliders, FaCircleQuestion, FaListCheck, FaArrowUpRightFromSquare, FaArrowsRotate } from "react-icons/fa6";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The few cookies Give Me Five Star uses to keep you signed in, and how to control them. No advertising or tracking cookies.",
  alternates: { canonical: "/cookies" },
};

const SUMMARY = [
  { Icon: FaCookieBite, title: "Just the essentials", text: "Cookies that keep you signed in and remember your choice." },
  { Icon: FaBan, title: "No tracking", text: "No advertising, analytics or tracking cookies." },
  { Icon: FaSliders, title: "Your choice", text: "Block or delete cookies any time in your browser." },
];

const ROWS = [
  { name: "qr_session", kind: "Essential", what: "Keeps you signed in to your dashboard.", how: "30 days, or until you sign out" },
  { name: "cookie-consent", kind: "Essential", what: "Remembers your cookie choice so we don't ask again. Saved in your browser's storage.", how: "Until you clear it" },
];

const SECTIONS: LegalSection[] = [
  {
    id: "what", Icon: FaCircleQuestion, title: "What cookies are",
    body: <p>Cookies are small files a website saves in your browser. Similar browser storage can also remember simple settings. They help a site remember you between pages and visits.</p>,
  },
  {
    id: "list", Icon: FaListCheck, title: "Cookies we use",
    body: (
      <>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Why</th><th className="px-4 py-3">How long</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROWS.map((r) => (
                <tr key={r.name}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-900">{r.name}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{r.kind}</span></td>
                  <td className="px-4 py-3">{r.what}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>These are needed for {site.name} to work, so they don&apos;t need your consent. If we ever add optional cookies, such as analytics, we will only use them if you choose &ldquo;Accept all&rdquo;, and we&apos;ll list them here first.</p>
      </>
    ),
  },
  {
    id: "none", Icon: FaBan, title: "What we don't use",
    body: <p>We don&apos;t use advertising cookies, we don&apos;t track you across other websites, and we don&apos;t sell cookie data to anyone.</p>,
  },
  {
    id: "others", Icon: FaArrowUpRightFromSquare, title: "Other websites",
    body: <p>When you open Google, WhatsApp, eSewa, Khalti or social media from our site, those services may set their own cookies. Their own policies apply there.</p>,
  },
  {
    id: "control", Icon: FaSliders, title: "Controlling cookies",
    body: <p>You can block or delete cookies in your browser settings. If you block the sign-in cookie, you won&apos;t be able to use your dashboard, but review pages and the rest of the site still work.</p>,
  },
  {
    id: "changes", Icon: FaArrowsRotate, title: "Changes",
    body: <p>We&apos;ll update this page if the cookies we use change. For everything else about your data, see our <Link href="/privacy">Privacy Policy</Link>.</p>,
  },
];

export default function CookiesPage() {
  return (
    <LegalPage path="/cookies" title="Cookie Policy" updated="27 September 2026" summary={SUMMARY} sections={SECTIONS}
      intro="We keep cookies to the bare minimum. Here's the complete list."
      contact={{ title: "Questions about cookies?", text: "Get in touch and we'll explain exactly what's stored." }} />
  );
}
