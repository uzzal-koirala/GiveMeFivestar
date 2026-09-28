"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CONTACT_TOPICS } from "@/lib/site";

export type ContactState = { error?: string; sent?: boolean; fields?: Record<string, string> } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number."),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().pipe(z.email("Enter a valid email or leave it empty."))]),
  business: z.string().trim().max(120),
  city: z.string().trim().max(60),
  topic: z.enum(CONTACT_TOPICS, "Choose a topic."),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(2000),
});

// Public contact form on the home page
export async function sendContact(_: ContactState, form: FormData): Promise<ContactState> {
  if (String(form.get("website") ?? "")) return { sent: true }; // hidden field only bots fill in
  const parsed = schema.safeParse(Object.fromEntries(form));
  // send what they typed back, so a mistake doesn't wipe the form
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: Object.fromEntries([...form].map(([k, v]) => [k, String(v)])) };
  await db.contactMessage.create({ data: parsed.data });
  revalidatePath("/admin", "layout");
  return { sent: true };
}

async function admin() {
  const u = await getCurrentUser();
  return u?.role === "super_admin" ? u : null;
}

export async function setMessageHandled(id: string, handled: boolean): Promise<{ error?: string }> {
  const a = await admin();
  if (!a) return { error: "Only a super admin can do that." };
  await db.contactMessage.update({ where: { id }, data: handled ? { status: "handled", handledAt: new Date(), handledBy: a.name } : { status: "new", handledAt: null, handledBy: "" } });
  revalidatePath("/admin", "layout");
  return {};
}

export async function deleteMessage(id: string): Promise<{ error?: string }> {
  if (!(await admin())) return { error: "Only a super admin can do that." };
  await db.contactMessage.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  return {};
}

// Careers: applications land in the same Messages inbox, tagged with the job
const applySchema = z.object({
  jobId: z.string(),
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email so we can reply.")),
  city: z.string().trim().max(60),
  message: z.string().trim().min(20, "Tell us a little about yourself (at least 20 characters).").max(3000),
});

export async function applyForJob(_: ContactState, form: FormData): Promise<ContactState> {
  if (String(form.get("website") ?? "")) return { sent: true };
  const parsed = applySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: Object.fromEntries([...form].map(([k, v]) => [k, String(v)])) };
  const { jobId, ...d } = parsed.data;
  const job = await db.jobPosition.findFirst({ where: { id: jobId, published: true }, select: { title: true } });
  if (!job) return { error: "This position is no longer open." };
  await db.contactMessage.create({ data: { ...d, topic: "Job application", business: `Applying for: ${job.title}` } });
  revalidatePath("/admin", "layout");
  return { sent: true };
}
