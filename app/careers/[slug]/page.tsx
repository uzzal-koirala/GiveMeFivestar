// One open position: details + application form (lands in the admin Messages inbox)
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaLocationDot, FaClock, FaBriefcase, FaMoneyBillWave } from "react-icons/fa6";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplyForm from "@/components/careers/ApplyForm";
import { db } from "@/lib/db";
import { RichText, plainText } from "@/lib/richtext";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
const getJob = (slug: string) => db.jobPosition.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob((await params).slug);
  if (!job) return { title: "Position not found" };
  return {
    title: `${job.title} (${job.location})`,
    description: job.summary,
    alternates: { canonical: `/careers/${job.slug}` },
    openGraph: { title: `${job.title} at Give Me Five Star`, description: job.summary, url: `/careers/${job.slug}` },
  };
}

export default async function JobPage({ params }: Props) {
  const job = await getJob((await params).slug);
  if (!job) notFound();
  // structured data so the role can appear in Google's job search
  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: job.title, description: plainText(job.body), datePosted: job.createdAt.toISOString(),
    employmentType: job.type.toUpperCase().replace("-", "_"),
    hiringOrganization: { "@type": "Organization", name: "Give Me Five Star", sameAs: SITE_URL },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "NP" } },
  };
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <section className="bg-blue-950 pb-24 pt-12 text-white">
          <div className="mx-auto max-w-5xl px-4">
            <Link href="/careers" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white"><FaArrowLeft className="size-3" /> All positions</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">{job.department}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">{job.title}</h1>
            <p className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15"><FaLocationDot className="size-3 text-amber-300" /> {job.location}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15"><FaClock className="size-3 text-amber-300" /> {job.type}</span>
              {job.salary && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15"><FaMoneyBillWave className="size-3 text-emerald-300" /> {job.salary}</span>}
            </p>
          </div>
        </section>
        <div className="mx-auto -mt-12 grid max-w-5xl gap-8 px-4 pb-24 lg:grid-cols-[1fr_360px]">
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="mb-6 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-slate-700"><FaBriefcase className="mt-1 size-4 shrink-0 text-blue-800" /> {job.summary}</p>
            <RichText text={job.body} />
          </article>
          <aside className="lg:sticky lg:top-28 lg:self-start"><ApplyForm jobId={job.id} title={job.title} /></aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
