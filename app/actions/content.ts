"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { JOB_TYPES } from "@/lib/site";

type Result = { error?: string; id?: string };
const denied = { error: "Only a super admin can do that." };
async function admin() {
  const u = await getCurrentUser();
  return u?.role === "super_admin" ? u : null;
}
// "keep" = unchanged, "" = remove, else a JPEG data URL resized in the browser
const image = z.union([z.literal("keep"), z.literal(""), z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "That image couldn't be read.").max(2_000_000, "That image is too large.")]);
const imageData = (v: string, field: string, at: string) =>
  v === "keep" ? {} : v === "" ? { [field]: null, [at]: null } : { [field]: Buffer.from(v.split(",")[1], "base64"), [at]: new Date() };
const refresh = () => { revalidatePath("/", "layout"); };

// ---------- Testimonials ----------
const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Enter the client's name.").max(80),
  role: z.string().trim().max(60),
  business: z.string().trim().min(2, "Enter the business name.").max(120),
  city: z.string().trim().max(60),
  quote: z.string().trim().min(15, "The quote is too short.").max(500, "Keep the quote under 500 characters."),
  rating: z.number().int().min(1).max(5),
  published: z.boolean(),
  photo: image,
});

export async function saveTestimonial(id: string | null, input: z.input<typeof testimonialSchema>): Promise<Result> {
  if (!(await admin())) return denied;
  const p = testimonialSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const { photo, ...d } = p.data;
  const data = { ...d, ...imageData(photo, "photo", "photoAt") };
  const row = id ? await db.testimonial.update({ where: { id }, data, select: { id: true } }) : await db.testimonial.create({ data, select: { id: true } });
  refresh();
  return { id: row.id };
}

export async function deleteTestimonial(id: string): Promise<Result> {
  if (!(await admin())) return denied;
  await db.testimonial.delete({ where: { id } });
  refresh();
  return {};
}

// ---------- Careers ----------
const jobSchema = z.object({
  title: z.string().trim().min(3, "Enter the job title.").max(100),
  department: z.string().trim().min(2, "Enter the department.").max(60),
  location: z.string().trim().min(2, "Enter the location.").max(80),
  type: z.enum(JOB_TYPES),
  salary: z.string().trim().max(60),
  summary: z.string().trim().min(10, "Write a one-line summary.").max(200),
  body: z.string().trim().min(30, "Describe the role (at least a few lines).").max(10000),
  published: z.boolean(),
});

async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  let slug = base, n = 2;
  while (await taken(slug)) slug = `${base}-${n++}`;
  return slug;
}

export async function saveJob(id: string | null, input: z.input<typeof jobSchema>): Promise<Result> {
  if (!(await admin())) return denied;
  const p = jobSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  if (id) {
    await db.jobPosition.update({ where: { id }, data: p.data });
  } else {
    const slug = await uniqueSlug(slugify(p.data.title), async (s) => !!(await db.jobPosition.findUnique({ where: { slug: s }, select: { id: true } })));
    id = (await db.jobPosition.create({ data: { ...p.data, slug }, select: { id: true } })).id;
  }
  refresh();
  return { id };
}

export async function deleteJob(id: string): Promise<Result> {
  if (!(await admin())) return denied;
  await db.jobPosition.delete({ where: { id } });
  refresh();
  return {};
}

// ---------- Blog ----------
const postSchema = z.object({
  title: z.string().trim().min(5, "Enter a title.").max(120),
  slug: z.string().trim().max(80),
  excerpt: z.string().trim().min(20, "Write a short summary (shown on the blog list and Google).").max(300),
  body: z.string().trim().min(50, "The post is too short.").max(50000),
  tags: z.string().trim().max(200),
  author: z.string().trim().max(80),
  seoTitle: z.string().trim().max(70, "Keep the SEO title under 70 characters."),
  seoDescription: z.string().trim().max(160, "Keep the SEO description under 160 characters."),
  published: z.boolean(),
  cover: image,
});

export async function savePost(id: string | null, input: z.input<typeof postSchema>): Promise<Result> {
  const a = await admin();
  if (!a) return denied;
  const p = postSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const { cover, slug: wanted, ...d } = p.data;
  const base = slugify(wanted || d.title);
  const slug = await uniqueSlug(base, async (s) => { const r = await db.blogPost.findUnique({ where: { slug: s }, select: { id: true } }); return !!r && r.id !== id; });
  const before = id ? await db.blogPost.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
  const data = {
    ...d, slug, author: d.author || a.name,
    tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8).join(", "),
    publishedAt: d.published ? before?.publishedAt ?? new Date() : before?.publishedAt ?? null, // first publish date stays
    ...imageData(cover, "cover", "coverAt"),
  };
  const row = id ? await db.blogPost.update({ where: { id }, data, select: { id: true } }) : await db.blogPost.create({ data, select: { id: true } });
  refresh();
  return { id: row.id };
}

export async function deletePost(id: string): Promise<Result> {
  if (!(await admin())) return denied;
  await db.blogPost.delete({ where: { id } });
  refresh();
  return {};
}

// ---------- Brand logos ----------
const logoSchema = z.object({
  name: z.string().trim().min(2, "Enter the brand name.").max(80),
  url: z.union([z.literal(""), z.url("Enter a full link starting with https://").max(300)]),
  published: z.boolean(),
  // "keep" = unchanged, else a PNG data URL resized in the browser
  logo: z.union([z.literal("keep"), z.string().regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "That logo couldn't be read.").max(1_500_000, "That logo is too large.")]),
});

export async function saveLogo(id: string | null, input: z.input<typeof logoSchema>): Promise<Result> {
  if (!(await admin())) return denied;
  const p = logoSchema.safeParse({ ...input, url: input.url?.trim() ?? "" });
  if (!p.success) return { error: p.error.issues[0].message };
  const { logo, ...d } = p.data;
  const file = logo === "keep" ? {} : { logo: Buffer.from(logo.split(",")[1], "base64"), logoAt: new Date() };
  if (!id && !("logo" in file)) return { error: "Upload the logo." };
  const row = id
    ? await db.brandLogo.update({ where: { id }, data: { ...d, ...file }, select: { id: true } })
    : await db.brandLogo.create({ data: { ...d, logo: file.logo!, sort: await db.brandLogo.count() }, select: { id: true } });
  refresh();
  return { id: row.id };
}

export async function deleteLogo(id: string): Promise<Result> {
  if (!(await admin())) return denied;
  await db.brandLogo.delete({ where: { id } });
  refresh();
  return {};
}
