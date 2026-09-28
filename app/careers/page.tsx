// Careers: open positions the super admin publishes
import type { Metadata } from "next";
import Link from "next/link";
import { FaArrowRight, FaBriefcase, FaLocationDot, FaClock, FaHeart, FaRocket, FaPeopleGroup, FaGraduationCap, FaEnvelope } from "react-icons/fa6";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";
import { getPlatform } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join Give Me Five Star and help local businesses around the world grow with honest Google reviews. See our open positions.",
  alternates: { canonical: "/careers" },
};

const PERKS = [
  { Icon: FaRocket, title: "Real impact", text: "Your work helps local shops, cafés and clinics grow." },
  { Icon: FaPeopleGroup, title: "Small, kind team", text: "Everyone's voice counts, from day one." },
  { Icon: FaGraduationCap, title: "Learn fast", text: "AI, product and sales, all in one place." },
  { Icon: FaHeart, title: "Global impact", text: "Build something used by businesses around the world." },
];

export default async function CareersPage() {
  const [jobs, { support }] = await Promise.all([
    db.jobPosition.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } }),
    getPlatform(),
  ]);
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <section className="bg-blue-950 pb-28 pt-16 text-white sm:pt-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Careers</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Help local businesses shine</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-blue-100/90">We&apos;re building the easiest way for local businesses to earn honest Google reviews. Come build it with us.</p>
          </div>
        </section>

        <div className="mx-auto -mt-16 max-w-5xl px-4 pb-24">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-700"><Icon className="size-4" /></span>
                <p className="mt-3 font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-16 text-2xl font-extrabold tracking-tight text-slate-900">Open positions <span className="text-slate-400">({jobs.length})</span></h2>
          {jobs.length ? (
            <ul className="mt-6 space-y-3">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/careers/${j.slug}`} className="group flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-900 text-amber-300"><FaBriefcase className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{j.department}</p>
                      <h3 className="mt-0.5 text-lg font-bold text-slate-900 group-hover:text-blue-800">{j.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{j.summary}</p>
                      <p className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1"><FaLocationDot className="size-2.5" /> {j.location}</span>
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1"><FaClock className="size-2.5" /> {j.type}</span>
                        {j.salary && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{j.salary}</span>}
                      </p>
                    </div>
                    <span className="flex items-center gap-2 text-sm font-bold text-blue-800">View role <FaArrowRight className="size-3 transition group-hover:translate-x-0.5" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FaBriefcase className="mx-auto size-8 text-slate-200" />
              <p className="mt-3 font-semibold text-slate-800">No open positions right now</p>
              <p className="mt-1 text-sm text-slate-500">We&apos;re always happy to meet great people. Send your CV and we&apos;ll keep you in mind.</p>
              {support.email && (
                <a href={`mailto:${support.email}?subject=${encodeURIComponent("Job enquiry")}`} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
                  <FaEnvelope className="size-3" /> Email your CV
                </a>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
