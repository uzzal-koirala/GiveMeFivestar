// Help Center: answers to common questions, grouped by topic
import type { Metadata } from "next";
import Link from "next/link";
import type { IconType } from "react-icons";
import { FaRocket, FaWandMagicSparkles, FaCrown, FaQrcode, FaUserShield, FaChevronDown, FaHeadset, FaArrowRight } from "react-icons/fa6";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { plans, STAND_PRICE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers to common questions about Give Me Five Star: getting started, AI reviews, plans and payments, QR stands and your data.",
  alternates: { canonical: "/help" },
};

const pro = plans.find((p) => p.id === "pro")!;
const free = plans.find((p) => p.id === "free")!;

const TOPICS: { id: string; Icon: IconType; title: string; faqs: [string, React.ReactNode][] }[] = [
  {
    id: "start", Icon: FaRocket, title: "Getting started",
    faqs: [
      ["How do I start?", <>Click <b>Get Started</b>, create your account and choose a plan. Then add your business name and your Google review link, and your QR code is ready to download.</>],
      ["Where do I find my Google review link?", <>Open your business on Google Maps or Google Search while signed in as the owner, choose <b>Ask for reviews</b> or <b>Share review form</b>, and copy the link. Paste it in the setup step.</>],
      ["Do my customers need an app?", <>No. They scan the QR code with their phone camera, and the review page opens in the browser.</>],
    ],
  },
  {
    id: "reviews", Icon: FaWandMagicSparkles, title: "Reviews and AI",
    faqs: [
      ["How does the AI write reviews?", <>The customer picks a star rating and what they tried. The AI writes a short draft from those choices. The customer reads it, can change it, and posts it from their own Google account.</>],
      ["Which languages can reviews be in?", <>Yes. Reviews can be in English, Nepali, or a natural mix of both.</>],
      ["Do reviews post to Google automatically?", <>No, and that&apos;s on purpose. Google only accepts reviews posted by the customer. Give Me Five Star copies the text and opens your Google review box so it takes seconds.</>],
      ["Can I add keywords?", <>Yes. Add a few words like your area or best dishes in <b>Settings</b>. The AI uses at most one naturally in each review.</>],
      ["What if a customer is unhappy?", <>They can still post on Google, and they can also send you private feedback so you can fix things quickly. See our <Link href="/review-guidelines">Review Guidelines</Link>.</>],
    ],
  },
  {
    id: "plans", Icon: FaCrown, title: "Plans and payments",
    faqs: [
      ["What's included for free?", <>The Free plan includes {free.reviews} AI reviews a month and up to {free.customers} customers in your list. It never expires.</>],
      ["How do I pay?", <>Choose a plan, pay with eSewa, Khalti or bank transfer, and upload the payment screenshot. Our team checks it and activates your plan, usually within a few hours.</>],
      ["What does Pro include?", <>{pro.reviews} AI reviews a month, up to {pro.customers} customers in your list, your own colours and photo on the review page, and no Give Me Five Star badge. See <Link href="/#pricing">pricing</Link> for everything.</>],
      ["Can I get a refund?", <>All payments are final, but we always fix payment mistakes. Read our <Link href="/refund-policy">Refund Policy</Link>.</>],
    ],
  },
  {
    id: "stands", Icon: FaQrcode, title: "QR codes and stands",
    faqs: [
      ["Can I print the QR code myself?", <>Yes. Download it from your dashboard and print it on table cards, receipts or posters.</>],
      ["Do you sell printed stands?", <>Yes. Order a QR stand from <b>Settings</b> for Rs {STAND_PRICE.toLocaleString("en-IN")}, with free delivery anywhere in Nepal. You can upload your own design too.</>],
      ["Where should I put the QR code?", <>Where customers wait with a free moment: tables, the counter, the bill folder or the waiting area. Our <Link href="/blog/where-to-place-your-review-qr-code">placement guide</Link> has ideas.</>],
    ],
  },
  {
    id: "account", Icon: FaUserShield, title: "Account and data",
    faqs: [
      ["Who can see my customers?", <>Only you. Each business sees only its own customers. Read our <Link href="/privacy">Privacy Policy</Link>.</>],
      ["I forgot my password.", <>Contact support from the sign-in screen and we&apos;ll help you get back in.</>],
      ["How do I delete my account?", <>Send us a message from <b>Support</b> in your dashboard, and we&apos;ll delete your business and customer data.</>],
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <section className="bg-blue-950 pb-32 pt-16 text-white sm:pt-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Help Center</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help?</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-blue-100/90">Quick answers to the questions businesses ask us most.</p>
          </div>
        </section>

        <div className="mx-auto -mt-20 max-w-4xl px-4 pb-20">
          <nav aria-label="Topics" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {TOPICS.map(({ id, Icon, title }) => (
              <a key={id} href={`#${id}`} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                <span className="grid size-10 place-items-center rounded-lg bg-blue-900 text-amber-300"><Icon className="size-4" /></span>
                {title}
              </a>
            ))}
          </nav>

          <div className="mt-10 space-y-10">
            {TOPICS.map(({ id, Icon, title, faqs }) => (
              <section key={id} id={id} className="scroll-mt-32">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-slate-900"><Icon className="size-4 text-blue-800" /> {title}</h2>
                <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
                  {faqs.map(([q, a]) => (
                    <details key={q} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-slate-900 hover:text-blue-900 [&::-webkit-details-marker]:hidden">
                        {q}
                        <FaChevronDown className="size-3 shrink-0 text-slate-400 transition group-open:rotate-180" />
                      </summary>
                      <p className="px-5 pb-5 leading-relaxed text-slate-600 [&_a]:font-semibold [&_a]:text-blue-800 [&_a:hover]:underline [&_b]:text-slate-900">{a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-5 rounded-xl bg-blue-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-300 text-blue-950"><FaHeadset className="size-5" /></span>
              <div>
                <p className="text-lg font-bold">Still need help?</p>
                <p className="mt-0.5 text-sm text-blue-100/80">Send us a message and a real person will reply.</p>
              </div>
            </div>
            <Link href="/#contact" className="flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-blue-950 hover:bg-amber-200">Contact us <FaArrowRight className="size-3" /></Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
