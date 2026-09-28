"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reviewPageSchema } from "@/lib/validators";
import { detailsFlags } from "@/lib/details-mode";
import { z } from "zod";
import { endOtherSessions, hashPassword, verifyPassword } from "@/lib/auth";
import { TONES } from "@/lib/tones";
import { readUpload } from "@/lib/uploads";
import { activePlan, canDesignPage, creditPacks, plans, YEARLY_MONTHS } from "@/lib/site";
import { enabledMethods, getPlatform } from "@/lib/platform";
import type { PaymentRequestView } from "@/lib/types";

export type ReviewPageState = { error?: string; saved?: boolean } | undefined;

// Settings -> Customer review page: skippable details + social links
export async function saveReviewPage(_: ReviewPageState, form: FormData): Promise<ReviewPageState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const parsed = reviewPageSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const link = await db.reviewLink.findUnique({ where: { userId: user.id }, select: { slug: true } });
  if (!link) return { error: "Finish your business setup first." };

  const { detailsMode, collectOnly, ...socials } = parsed.data;
  // "Details only" exists to collect details, so the details step is always required there
  const mode = collectOnly ? "required" : detailsMode;
  await db.reviewLink.update({ where: { userId: user.id }, data: { ...socials, collectOnly, ...detailsFlags(mode) } });
  revalidatePath(`/r/${link.slug}`);
  return { saved: true };
}

// ---- Profile, business and AI settings ----
const settingsSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter your full name.").max(80),
  phone: z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number.")]),
  // "keep" = unchanged, "" = remove, otherwise a small JPEG data URL from PhotoUpload
  photo: z.union([z.literal("keep"), z.literal(""), z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "That photo couldn't be read.").max(400_000, "That photo is too large.")]),
  businessName: z.string().trim().min(2, "Enter your business name.").max(120),
  location: z.string().trim().max(120),
  products: z.array(z.string().trim().min(1).max(60)).max(30, "Add up to 30 products or services."),
  description: z.string().trim().max(1000),
  tone: z.enum(TONES.map((t) => t.id) as [string, ...string[]]),
  language: z.enum(["en", "ne", "mix"]),
  aiInstructions: z.string().trim().max(2000),
  keywords: z.array(z.string().trim().min(1).max(40, "Keep each keyword under 40 characters.")).max(10, "Add up to 10 keywords."),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export async function saveSettings(input: SettingsInput): Promise<{ error?: string; avatarUrl?: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { ownerName, phone, photo, businessName, products, keywords, ...business } = parsed.data;

  const now = new Date();
  await db.user.update({
    where: { id: user.id },
    data: {
      name: ownerName, businessName, phone: phone || null,
      ...(photo === "" && { avatar: null, avatarAt: null }),
      ...(photo.startsWith("data:") && { avatar: Buffer.from(photo.split(",")[1], "base64"), avatarAt: now }),
    },
  });
  const link = await db.reviewLink.findUnique({ where: { userId: user.id }, select: { slug: true } });
  if (link) {
    await db.reviewLink.update({ where: { userId: user.id }, data: { businessName, products: JSON.stringify(products), keywords: JSON.stringify(keywords), ...business } });
    revalidatePath(`/r/${link.slug}`);
  }
  revalidatePath("/dashboard", "layout"); // name/photo in the top bar
  const avatarUrl = photo === "keep" ? undefined : photo ? `/api/avatar/${user.id}?v=${now.getTime()}` : null;
  return { avatarUrl };
}

// ---- Login email and password (both need the current password) ----
export async function saveSecurity(input: { email: string; currentPassword: string; newPassword: string }): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const email = input.email.trim().toLowerCase();
  const emailChanged = email !== user.email;
  if (!emailChanged && !input.newPassword) return {};

  if (!z.email().safeParse(email).success) return { error: "Enter a valid email address." };
  if (input.newPassword && input.newPassword.length < 8) return { error: "New password must be at least 8 characters." };
  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!input.currentPassword || !row || !(await verifyPassword(input.currentPassword, row.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  if (emailChanged && (await db.user.findUnique({ where: { email }, select: { id: true } }))) {
    return { error: "Another account already uses this email." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { ...(emailChanged && { email }), ...(input.newPassword && { passwordHash: await hashPassword(input.newPassword) }) },
  });
  if (input.newPassword) await endOtherSessions(user.id);
  revalidatePath("/dashboard", "layout");
  return {};
}

// ---- Plan upgrades and AI review top-ups (manual payment proof, approved by the super admin) ----
export async function requestPayment(form: FormData): Promise<{ error?: string; payment?: PaymentRequestView }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const kind = String(form.get("kind"));
  const item = String(form.get("item"));
  const method = String(form.get("method"));
  const txnId = String(form.get("txnId") ?? "").trim().slice(0, 80);
  if (!enabledMethods(await getPlatform()).some((m) => m.id === method)) return { error: "Choose how you paid." };

  // price comes from the server's own list, never from the browser
  let amount = 0;
  if (kind === "topup") {
    // Free and expired plans upgrade instead; Business is already unlimited
    const account = await db.user.findUnique({ where: { id: user.id }, select: { plan: true, planExpiresAt: true } });
    const current = activePlan(account?.plan ?? "free", account?.planExpiresAt);
    if (current !== "pro") {
      return { error: current === "business" ? "Your Business plan already has unlimited AI reviews." : "AI review top-ups are for active Pro plans. Please upgrade or renew your plan first." };
    }
    amount = creditPacks.find((p) => p.id === item)?.price ?? 0;
  } else if (kind === "plan") {
    const [planId, cycle] = item.split(":");
    const plan = plans.find((p) => p.id === planId);
    if (!plan?.price || (cycle !== "monthly" && cycle !== "yearly")) return { error: "Choose a plan." };
    amount = cycle === "yearly" ? plan.price * YEARLY_MONTHS : plan.price;
  }
  if (!amount) return { error: "Choose what you’re paying for." };

  const proof = await readUpload(form.get("proof"));
  if (proof.error || !proof.file) return { error: proof.error ?? "Please upload your payment proof." };

  // trying again: an older rejection doesn't need its own popup any more
  await db.paymentRequest.updateMany({ where: { userId: user.id, kind, status: "rejected" }, data: { noticeSeen: true } });
  const p = await db.paymentRequest.create({
    data: { userId: user.id, kind, item, amount, method, txnId, proofName: proof.file.name, proofType: proof.file.type, proofData: proof.file.data },
    omit: { proofData: true },
  });
  return { payment: { id: p.id, kind: p.kind, item: p.item, amount: p.amount, method: p.method, status: p.status, createdAt: p.createdAt.toISOString() } };
}

// ---- Review page design: brand colour + header image (Pro and Business only) ----
const designSchema = z.object({
  color: z.union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour.")]),
  // "keep" = unchanged, "" = remove, otherwise a JPEG data URL resized in the browser
  image: z.union([z.literal("keep"), z.literal(""), z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "That image couldn't be read.").max(1_500_000, "That image is too large.")]),
});

export async function saveReviewDesign(input: z.input<typeof designSchema>): Promise<{ error?: string; imageUrl?: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const account = await db.user.findUnique({ where: { id: user.id }, select: { plan: true, planExpiresAt: true } });
  if (!canDesignPage(activePlan(account?.plan ?? "free", account?.planExpiresAt))) return { error: "Custom review page design is part of the Pro and Business plans." };
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const link = await db.reviewLink.findUnique({ where: { userId: user.id }, select: { slug: true } });
  if (!link) return { error: "Finish your business setup first." };

  const { color, image } = parsed.data;
  const now = new Date();
  await db.reviewLink.update({
    where: { userId: user.id },
    data: {
      themeColor: color.toLowerCase(),
      ...(image === "" && { bgImage: null, bgImageType: null, bgImageAt: null }),
      ...(image.startsWith("data:") && { bgImage: Buffer.from(image.split(",")[1], "base64"), bgImageType: "image/jpeg", bgImageAt: now }),
    },
  });
  revalidatePath(`/r/${link.slug}`);
  return { imageUrl: image === "keep" ? undefined : image ? `/api/review-bg/${link.slug}?v=${now.getTime()}` : null };
}
