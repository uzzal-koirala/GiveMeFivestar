// Blog index, news style: masthead + topic bar, top story with side stories, latest list, sidebar; ?q= search and ?tag= topics
import type { Metadata } from "next";
import Link from "next/link";
import { FaClock, FaNewspaper, FaXmark } from "react-icons/fa6";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogSidebar, { SearchBox } from "@/components/blog/BlogSidebar";
import { db } from "@/lib/db";
import { plainText, readingMinutes } from "@/lib/richtext";

export const metadata: Metadata = {
  title: "Blog: Google review tips for local businesses",
  description: "Practical guides on getting more Google reviews, ranking higher on Google Maps and growing your local business.",
  alternates: { canonical: "/blog" },
};

type Props = { searchParams: Promise<{ tag?: string; q?: string }> };
type Post = { id: string; slug: string; title: string; excerpt: string; body: string; tags: string; author: string; coverAt: Date | null; publishedAt: Date | null; createdAt: Date };

const tagsOf = (t: string) => t.split(",").map((s) => s.trim()).filter(Boolean);
const dateOf = (p: Post) => p.publishedAt ?? p.createdAt;
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const cover = (p: Post) => (p.coverAt ? `/api/img/blog/${p.id}?v=${p.coverAt.getTime()}` : null);

function Cover({ p, className, eager }: { p: Post; className: string; eager?: boolean }) {
  const src = cover(p);
  return (
    <div className={`overflow-hidden bg-blue-900 ${className}`}>
      {src
        ? <img src={src} alt="" loading={eager ? "eager" : "lazy"} className="size-full object-cover transition duration-500 group-hover:scale-105" />
        : <div className="grid size-full place-items-center text-amber-300"><FaNewspaper className="size-8" /></div>}
    </div>
  );
}

function Meta({ p }: { p: Post }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      {p.author && <span className="font-semibold text-slate-700">{p.author}</span>}
      <time dateTime={dateOf(p).toISOString()}>{fmt(dateOf(p))}</time>
      <span className="flex items-center gap-1"><FaClock className="size-2.5" /> {readingMinutes(p.body)} min read</span>
    </p>
  );
}

const Kicker = ({ p }: { p: Post }) => tagsOf(p.tags)[0] ? <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-amber-600">{tagsOf(p.tags)[0]}</p> : null;

// horizontal "latest" row
function Row({ p }: { p: Post }) {
  return (
    <li>
      <Link href={`/blog/${p.slug}`} className="group grid gap-4 py-5 sm:grid-cols-[240px_1fr] sm:gap-6">
        <Cover p={p} className="aspect-[16/9] rounded-lg" />
        <div className="min-w-0">
          <Kicker p={p} />
          <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900 group-hover:text-blue-800 sm:text-xl">{p.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.excerpt}</p>
          <div className="mt-3"><Meta p={p} /></div>
        </div>
      </Link>
    </li>
  );
}

export default async function BlogPage({ searchParams }: Props) {
  const { tag, q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const all: Post[] = await db.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, body: true, tags: true, author: true, coverAt: true, publishedAt: true, createdAt: true },
  });

  // topics with counts, most used first
  const counts = new Map<string, number>();
  all.forEach((p) => tagsOf(p.tags).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  const topics = [...counts].sort((a, b) => b[1] - a[1]);

  // ponytail: search filters in memory, fine for hundreds of posts; move to a DB full-text index if the blog grows past that
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (p: Post) => {
    const hay = `${p.title} ${p.excerpt} ${p.tags} ${plainText(p.body)}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  };
  const filtered = all.filter((p) => (!tag || tagsOf(p.tags).includes(tag)) && (!words.length || matches(p)));
  const browsing = !tag && !q;
  const [top, ...others] = all;
  const side = others.slice(0, 3);
  const latest = browsing ? others.slice(3) : filtered;
  const recent = all.slice(0, 5).map((p) => ({ slug: p.slug, title: p.title, date: dateOf(p) }));
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Header />
      <main className="bg-slate-50">
        {/* masthead */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-double border-blue-950 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{today}</p>
                <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-blue-950 sm:text-5xl">Give Me Five Star <span className="text-amber-500">Blog</span></h1>
                <p className="mt-1 text-sm text-slate-600">Google review tips and local growth guides for businesses everywhere.</p>
              </div>
              <SearchBox q={q} className="w-full sm:w-80" />
            </div>
            <nav aria-label="Topics" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 py-2 text-sm font-semibold">
              {([["All", "/blog"], ...topics.map(([t]) => [t, `/blog?tag=${encodeURIComponent(t)}`])] as [string, string][]).map(([label, href]) => {
                const on = label === "All" ? browsing : tag === label;
                return (
                  <Link key={label} href={href} className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 transition ${on ? "bg-blue-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-blue-950"}`}>{label}</Link>
                );
              })}
            </nav>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {!all.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <FaNewspaper className="mx-auto size-8 text-slate-200" />
                <p className="mt-3 font-semibold text-slate-800">No articles yet</p>
                <p className="mt-1 text-sm text-slate-500">New guides are on the way. Check back soon.</p>
              </div>
            )}

            {/* front page: top story + side stories */}
            {browsing && top && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Link href={`/blog/${top.slug}`} className="group block">
                  <Cover p={top} className="aspect-[16/10] rounded-xl" eager />
                  <div className="mt-4">
                    <Kicker p={top} />
                    <h2 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 group-hover:text-blue-800 sm:text-3xl">{top.title}</h2>
                    <p className="mt-3 leading-relaxed text-slate-600">{top.excerpt}</p>
                    <div className="mt-3"><Meta p={top} /></div>
                  </div>
                </Link>
                {side.length > 0 && (
                  <div className="lg:border-l lg:border-slate-200 lg:pl-6">
                    <p className="border-b-2 border-blue-950 pb-2 text-xs font-extrabold uppercase tracking-[0.15em] text-blue-950">More stories</p>
                    <ul className="divide-y divide-slate-200">
                      {side.map((p) => (
                        <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className="group flex gap-4 py-4">
                            <div className="min-w-0 flex-1">
                              <Kicker p={p} />
                              <h3 className="mt-1 font-bold leading-snug text-slate-900 group-hover:text-blue-800">{p.title}</h3>
                              <p className="mt-1.5 text-xs text-slate-500">{fmt(dateOf(p))}</p>
                            </div>
                            <Cover p={p} className="size-20 shrink-0 rounded-lg" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* search / topic heading */}
            {!browsing && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-blue-950 pb-3">
                <h2 className="text-xl font-extrabold text-blue-950">
                  {filtered.length} {filtered.length === 1 ? "article" : "articles"}
                  {q && <> for &ldquo;{q}&rdquo;</>}
                  {tag && <> in <span className="text-amber-600">{tag}</span></>}
                </h2>
                <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-800"><FaXmark className="size-3" /> Clear</Link>
              </div>
            )}

            {!browsing && !filtered.length && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="font-semibold text-slate-800">Nothing found</p>
                <p className="mt-1 text-sm text-slate-500">Try another word, or browse a topic from the list.</p>
              </div>
            )}

            {/* latest list */}
            {latest.length > 0 && (
              <section className={browsing ? "mt-12" : ""}>
                {browsing && <p className="border-b-2 border-blue-950 pb-2 text-xs font-extrabold uppercase tracking-[0.15em] text-blue-950">Latest</p>}
                <ul className="divide-y divide-slate-200">{latest.map((p) => <Row key={p.id} p={p} />)}</ul>
              </section>
            )}

          </div>

          <BlogSidebar q={q} topics={topics} recent={recent} current={tag} />
        </div>
      </main>
      <Footer />
    </>
  );
}
