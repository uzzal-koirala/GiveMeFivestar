// Website content: testimonials, brand logos, careers and blog
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import ContentManager from "@/components/admin/ContentManager";
import { SITE_URL } from "@/lib/site";

export default async function AdminContent() {
  await requireSuperAdmin();
  const [testimonials, jobs, posts, logos] = await Promise.all([
    db.testimonial.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }], omit: { photo: true } }),
    db.jobPosition.findMany({ orderBy: { createdAt: "desc" } }),
    db.blogPost.findMany({ orderBy: { updatedAt: "desc" }, omit: { cover: true } }),
    db.brandLogo.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }], omit: { logo: true } }),
  ]);
  return (
    <div className="space-y-6">
      <PageTitle title="Content" desc="What visitors see on your website: client testimonials, brand logos, open positions and blog posts." />
      <ContentManager
        siteUrl={SITE_URL}
        logos={logos.map((l) => ({ id: l.id, name: l.name, url: l.url, published: l.published, logoUrl: `/api/img/brand/${l.id}?v=${l.logoAt.getTime()}` }))}
        testimonials={testimonials.map((t) => ({ id: t.id, name: t.name, role: t.role, business: t.business, city: t.city, quote: t.quote, rating: t.rating, published: t.published, photoUrl: t.photoAt ? `/api/img/testimonial/${t.id}?v=${t.photoAt.getTime()}` : null }))}
        jobs={jobs.map((j) => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: undefined }))}
        posts={posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body, tags: p.tags, author: p.author, seoTitle: p.seoTitle, seoDescription: p.seoDescription, published: p.published, publishedAt: p.publishedAt?.toISOString() ?? null, coverUrl: p.coverAt ? `/api/img/blog/${p.id}?v=${p.coverAt.getTime()}` : null, updatedAt: p.updatedAt.toISOString() }))}
      />
    </div>
  );
}
