// One blog post: full SEO metadata, BlogPosting + breadcrumb JSON-LD, share links, related posts
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaArrowRight, FaClock, FaFacebookF, FaWhatsapp, FaXTwitter, FaNewspaper } from "react-icons/fa6";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { db } from "@/lib/db";
import { RichText, readingMinutes } from "@/lib/richtext";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
const getPost = (slug: string) => db.blogPost.findFirst({ where: { slug, published: true }, omit: { cover: true } });
const coverUrl = (p: { id: string; coverAt: Date | null }) => (p.coverAt ? `/api/img/blog/${p.id}?v=${p.coverAt.getTime()}` : null);
const tagsOf = (t: string) => t.split(",").map((s) => s.trim()).filter(Boolean);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Post not found" };
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const img = coverUrl(post);
  return {
    title: { absolute: title },
    description,
    keywords: tagsOf(post.tags),
    authors: post.author ? [{ name: post.author }] : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article", title, description, url: `/blog/${post.slug}`,
      publishedTime: (post.publishedAt ?? post.createdAt).toISOString(), modifiedTime: post.updatedAt.toISOString(),
      authors: post.author ? [post.author] : undefined, tags: tagsOf(post.tags),
      images: img ? [{ url: img, alt: post.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: img ? [img] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const related = await db.blogPost.findMany({
    where: { published: true, id: { not: post.id } }, orderBy: { publishedAt: "desc" }, take: 3,
    select: { id: true, slug: true, title: true, excerpt: true, coverAt: true },
  });
  // sidebar: topics with counts and most recent posts
  const allPosts = await db.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, select: { slug: true, title: true, tags: true, publishedAt: true, createdAt: true } });
  const counts = new Map<string, number>();
  allPosts.forEach((p) => tagsOf(p.tags).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  const topics = [...counts].sort((a, b) => b[1] - a[1]);
  const recent = allPosts.filter((p) => p.slug !== post.slug).slice(0, 5).map((p) => ({ slug: p.slug, title: p.title, date: p.publishedAt ?? p.createdAt }));
  const url = `${SITE_URL}/blog/${post.slug}`;
  const img = coverUrl(post);
  const published = post.publishedAt ?? post.createdAt;
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: post.title, description: post.seoDescription || post.excerpt, url, mainEntityOfPage: url,
      datePublished: published.toISOString(), dateModified: post.updatedAt.toISOString(),
      image: img ? `${SITE_URL}${img}` : undefined, keywords: post.tags || undefined,
      author: { "@type": "Person", name: post.author || "Give Me Five Star" },
      publisher: { "@type": "Organization", name: "Give Me Five Star", url: SITE_URL },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  const share = [
    { label: "Share on Facebook", Icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "Share on WhatsApp", Icon: FaWhatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}` },
    { label: "Share on X", Icon: FaXTwitter, href: `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}` },
  ];

  return (
    <>
      <Header />
      <main className="bg-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <article>
          <header className="bg-blue-950 pb-32 pt-12 text-white">
            <div className="mx-auto max-w-7xl px-4 lg:pr-[calc(320px+3.5rem)]">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                <Link href="/blog" className="flex items-center gap-2 hover:text-white"><FaArrowLeft className="size-3" /> Blog</Link>
              </nav>
              {tagsOf(post.tags).length > 0 && (
                <p className="mt-6 flex flex-wrap gap-2">
                  {tagsOf(post.tags).map((t) => <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-blue-950 hover:bg-amber-300">{t}</Link>)}
                </p>
              )}
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
              <p className="mt-4 text-lg text-blue-100/90">{post.excerpt}</p>
              <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-200">
                {post.author && <span className="font-semibold text-white">By {post.author}</span>}
                <time dateTime={published.toISOString()}>{published.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>
                <span className="flex items-center gap-1.5"><FaClock className="size-3" /> {readingMinutes(post.body)} min read</span>
              </p>
            </div>
          </header>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <div className="min-w-0">
            <div className="-mt-24">
              {img
                ? <img src={img} alt={post.title} className="aspect-[16/9] w-full rounded-2xl object-cover shadow-xl" />
                : <div className="h-24" />}
            </div>
            <div className="mx-auto mt-12 max-w-3xl">
            <RichText text={post.body} />
            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
              <span className="text-sm font-semibold text-slate-700">Share this article</span>
              {share.map(({ label, Icon, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                  className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-900 hover:text-white">
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
            </div>
          </div>
          <div className="lg:pt-10"><BlogSidebar topics={topics} recent={recent} /></div>
          </div>
        </article>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-blue-950 p-8 text-center text-white sm:p-12">
              <h2 className="text-2xl font-extrabold sm:text-3xl">Get more Google reviews, the easy way</h2>
              <p className="mx-auto mt-3 max-w-lg text-blue-100/90">Put a Give Me Five Star QR code on your counter. Customers tap, AI writes the review, they post it in seconds.</p>
              <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-bold text-blue-950 hover:bg-amber-300">Start free <FaArrowRight className="size-3" /></Link>
            </div>

            {related.length > 0 && (
              <>
                <h2 className="mt-16 text-2xl font-extrabold tracking-tight text-slate-900">Keep reading</h2>
                <ul className="mt-6 grid gap-6 sm:grid-cols-3">
                  {related.map((p) => (
                    <li key={p.id}>
                      <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                        <div className="aspect-[16/9] bg-blue-900">
                          {coverUrl(p) ? <img src={coverUrl(p)!} alt="" loading="lazy" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-amber-300"><FaNewspaper className="size-7" /></div>}
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-800">{p.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.excerpt}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
