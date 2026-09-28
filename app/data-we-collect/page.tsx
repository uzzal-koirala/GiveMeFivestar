// Plain list of every kind of personal data the app stores: what, why, who sees it, how long. Keep in sync with prisma/schema.prisma
import type { Metadata } from "next";
import Link from "next/link";
import {
  FaListCheck, FaEyeSlash, FaTrashCan, FaBriefcase, FaUsers, FaMoneyCheckDollar, FaTruckFast, FaHeadset, FaEnvelope, FaKey, FaServer, FaWandMagicSparkles, FaBan,
} from "react-icons/fa6";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Data We Collect",
  description: `Every kind of information ${site.name} stores, why we need it, who can see it and how long we keep it.`,
  alternates: { canonical: "/data-we-collect" },
};

type Row = { what: React.ReactNode; why: string; who: string; kept: string };

// one card per group: the data, then why / who sees it / how long
function DataCard({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="font-semibold text-slate-900">{r.what}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {([["Why", r.why], ["Who can see it", r.who], ["How long", r.kept]] as const).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 text-slate-600">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

const WHILE_ACTIVE = "While your account is open";

const SUMMARY = [
  { Icon: FaListCheck, title: "Everything, listed", text: "Each kind of data we store, in one place." },
  { Icon: FaEyeSlash, title: "Seen by few", text: "Only you, your business, or our small team. Never sold." },
  { Icon: FaTrashCan, title: "Deleted on request", text: "Close your account and your business data goes with it." },
];

const SECTIONS: LegalSection[] = [
  {
    id: "owners", Icon: FaBriefcase, title: "Business owner accounts",
    body: <DataCard rows={[
      { what: "Name, email address, phone number", why: "To sign you in, contact you about your account and show your name in the dashboard.", who: "You and our team.", kept: WHILE_ACTIVE },
      { what: <>Password <span className="font-normal text-slate-500">(stored only as a one-way hash, never readable)</span></>, why: "To check it is really you when you sign in.", who: "No one, not even our team.", kept: WHILE_ACTIVE },
      { what: "Business name, location, description, products, Google review link, website and social links", why: "To build your review page and help the AI write relevant reviews.", who: "Public on your review page, plus you and our team.", kept: WHILE_ACTIVE },
      { what: "Profile photo or logo, review page colour and header image", why: "To brand your review page and dashboard.", who: "Public on your review page.", kept: WHILE_ACTIVE },
      { what: "Plan, AI review credits and plan history", why: "To apply your plan limits and show your billing history.", who: "You and our team.", kept: WHILE_ACTIVE },
    ]} />,
  },
  {
    id: "customers", Icon: FaUsers, title: "Customers who use a review page",
    body: <>
      <DataCard rows={[
        { what: "Name, phone number and location (the business can make these optional or skip them)", why: "So the business knows who visited and can follow up.", who: "Only that business and our team.", kept: "Until the business deletes it or closes its account" },
        { what: "What you bought or tried, your star rating, the review you copied, or private feedback", why: "To write the review draft and show the business how customers rated it.", who: "Only that business and our team.", kept: "Until the business deletes it or closes its account" },
        { what: "Customer lists a business imports from a CSV file (name, phone, location, product, date)", why: "So the business keeps all its customers in one list.", who: "Only that business and our team.", kept: "Until the business deletes it or closes its account" },
      ]} />
      <p>The review itself is posted by the customer from their own Google account. We never see or store Google passwords.</p>
    </>,
  },
  {
    id: "payments", Icon: FaMoneyCheckDollar, title: "Payments",
    body: <>
      <DataCard rows={[
        { what: "Payment method, amount, transaction ID and the payment screenshot you upload", why: "To check your payment and apply your plan, top-up or ad.", who: "You and our team.", kept: "As long as accounting and tax rules require" },
      ]} />
      <p>We don&apos;t collect card numbers or wallet passwords. You pay through your own wallet or bank, then send us the proof.</p>
    </>,
  },
  {
    id: "stands", Icon: FaTruckFast, title: "QR stand orders",
    body: <DataCard rows={[
      { what: "Receiver's name, phone number, delivery address, landmark and delivery notes", why: "To print and deliver your stands.", who: "You, our team and the delivery partner.", kept: "As long as accounting and tax rules require" },
      { what: "Your own stand design file, if you upload one", why: "To print your custom design.", who: "You and our team.", kept: "With the order record" },
    ]} />,
  },
  {
    id: "support", Icon: FaHeadset, title: "Support, contact form and job applications",
    body: <DataCard rows={[
      { what: "Support tickets: your messages and any file you attach", why: "To answer your questions and fix problems.", who: "You and our team.", kept: WHILE_ACTIVE },
      { what: "Contact form and job applications: name, phone, email, business, city and your message", why: "To reply to you, or to consider your application.", who: "Our team.", kept: "Until our team deletes the message" },
    ]} />,
  },
  {
    id: "security", Icon: FaKey, title: "Sign-in and security",
    body: <DataCard rows={[
      { what: <>Sign-in cookie <span className="font-normal text-slate-500">(a random code; we store only a hash of it)</span></>, why: "To keep you signed in.", who: "No one can read it.", kept: "30 days, or until you log out" },
      { what: "Email verification code (6 digits, stored only as a hash)", why: "To confirm the email address belongs to you when you sign up.", who: "No one can read it.", kept: "10 minutes, deleted once used" },
      { what: "Count of wrong password attempts per email", why: "To block password-guessing attacks.", who: "No one; it is used automatically.", kept: "15 minutes, never saved to disk" },
    ]} />,
  },
  {
    id: "technical", Icon: FaServer, title: "Technical logs and backups",
    body: <DataCard rows={[
      { what: "Server logs: IP address, browser type, page requested and time", why: "To keep the service running, find errors and stop abuse.", who: "Our team.", kept: "About 2 weeks" },
      { what: "Daily database backups", why: "So nothing is lost if something goes wrong.", who: "Our team.", kept: "14 days, then deleted automatically" },
    ]} />,
  },
  {
    id: "ai", Icon: FaWandMagicSparkles, title: "What we send to our AI provider",
    body: <p>To write a review draft we send the <b>business name, description, keywords, chosen tone and language, the product and the star rating</b>. We <b>do not</b> send customers&apos; names, phone numbers or locations.</p>,
  },
  {
    id: "email", Icon: FaEnvelope, title: "Emails we send",
    body: <p>We send account emails, such as your sign-up verification code, through our email provider. We don&apos;t send marketing emails and we don&apos;t share your address with advertisers.</p>,
  },
  {
    id: "never", Icon: FaBan, title: "What we never collect or do",
    body: <ul>
      <li>We never sell personal data or use it for advertising.</li>
      <li>We don&apos;t use advertising or tracking cookies. See our <Link href="/cookies">Cookie Policy</Link>.</li>
      <li>We never ask for Google passwords, card numbers or wallet PINs.</li>
      <li>Businesses can only ever see their own customers.</li>
    </ul>,
  },
];

export default function DataWeCollectPage() {
  return (
    <LegalPage path="/data-we-collect" title="Data We Collect" updated="28 September 2026" summary={SUMMARY} sections={SECTIONS}
      intro="A plain list of every kind of information we store: why we need it, who can see it, and how long we keep it."
      contact={{ title: "Want a copy of your data, or want it deleted?", text: "Message us and we'll help within 30 days. Full details are in our Privacy Policy." }} />
  );
}
