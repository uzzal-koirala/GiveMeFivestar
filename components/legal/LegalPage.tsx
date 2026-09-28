// Shared layout for policy pages: navy hero, 3 "at a glance" cards, contents list, numbered sections, contact strip
import Link from "next/link";
import type { IconType } from "react-icons";
import { FaWhatsapp, FaEnvelope, FaArrowRight } from "react-icons/fa6";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPlatform } from "@/lib/platform";

export type LegalSection = { id: string; Icon: IconType; title: string; body: React.ReactNode };

// other policies, shown at the bottom of each one
const POLICIES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/data-we-collect", label: "Data We Collect" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/review-guidelines", label: "Review Guidelines" },
];

export default async function LegalPage({ path, title, intro, updated, summary, sections, contact }: {
  path: string; title: string; intro: string; updated: string;
  summary: { Icon: IconType; title: string; text: string }[];
  sections: LegalSection[];
  contact: { title: string; text: string };
}) {
  const { support } = await getPlatform();
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <section className="bg-blue-950 pb-40 pt-16 text-white sm:pt-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Legal</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-blue-100/90">{intro}</p>
            <p className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm text-blue-100 ring-1 ring-white/15">Last updated {updated}</p>
          </div>
        </section>

        <div className="mx-auto -mt-28 max-w-5xl px-4 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {summary.map(({ Icon, title, text }, i) => (
              <div key={title} className={`rounded-xl p-6 shadow-sm ${i === 0 ? "bg-amber-300 text-blue-950" : "border border-slate-200 bg-white"}`}>
                <span className={`grid size-11 place-items-center rounded-lg ${i === 0 ? "bg-blue-950 text-amber-300" : "bg-blue-50 text-blue-900"}`}><Icon className="size-4" /></span>
                <p className="mt-4 font-bold">{title}</p>
                <p className={`mt-1 text-sm ${i === 0 ? "text-blue-950/80" : "text-slate-500"}`}>{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-32 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">On this page</p>
                <ul className="mt-2 space-y-0.5 text-sm">
                  {sections.map((s) => (
                    <li key={s.id}><a href={`#${s.id}`} className="block rounded-md px-2 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-blue-900">{s.title}</a></li>
                  ))}
                </ul>
              </div>
            </nav>

            <article className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
              {sections.map(({ id, Icon, title, body }, i) => (
                <section key={id} id={id} className="scroll-mt-32 p-6 sm:p-8">
                  <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-900"><Icon className="size-3.5" /></span>
                    <span><span className="mr-2 text-slate-300">{String(i + 1).padStart(2, "0")}</span>{title}</span>
                  </h2>
                  <div className="mt-4 space-y-3 leading-relaxed text-slate-600 sm:pl-12 [&_a]:font-semibold [&_a]:text-blue-800 [&_a:hover]:underline [&_b]:text-slate-900 [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2.5 [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-amber-400 [&_ul]:space-y-2">
                    {body}
                  </div>
                </section>
              ))}
            </article>
          </div>

          <div className="mt-8 flex flex-col items-start gap-5 rounded-xl bg-blue-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-lg font-bold">{contact.title}</p>
              <p className="mt-1 text-sm text-blue-100/80">{contact.text}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {support.whatsapp && (
                <a href={support.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-blue-950 hover:bg-amber-200">
                  <FaWhatsapp className="size-4" /> WhatsApp us
                </a>
              )}
              {support.email && (
                <a href={`mailto:${support.email}`} className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold ring-1 ring-white/25 hover:bg-white/10">
                  <FaEnvelope className="size-3.5" /> {support.email}
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Other policies" className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            {POLICIES.filter((p) => p.href !== path).map((p) => (
              <Link key={p.href} href={p.href} className="inline-flex items-center gap-1 font-semibold text-blue-800 hover:underline">{p.label} <FaArrowRight className="size-2.5" /></Link>
            ))}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
