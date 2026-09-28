"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getAiConfig, maskKey, setSetting, type PaymentMethod } from "@/lib/platform";
import { isGoogleUrl, GOOGLE_URL_ERROR, email as emailSchema, socialLinks } from "@/lib/validators";
import { slugFor } from "@/lib/slug";
import { activePlan, addMonths, creditPacks, plans } from "@/lib/site";

type Result = { error?: string };

// every admin action starts here: the server never trusts that the button was hidden
async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "super_admin" ? user : null;
}
const denied = { error: "Only a super admin can do that." };

// ---------- Payments: plan upgrades and AI review top-ups ----------
export async function decidePayment(id: string, approve: boolean): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return denied;
  const p = await db.paymentRequest.findUnique({ where: { id }, omit: { proofData: true } });
  if (!p) return { error: "Payment not found." };
  if (p.status !== "submitted") return { error: "This payment was already reviewed." };

  const pack = p.kind === "topup" ? creditPacks.find((c) => c.id === p.item) : undefined;
  const [planId, cycle] = p.item.split(":");
  const plan = p.kind === "topup" ? undefined : plans.find((x) => x.id === planId);
  if (approve && !pack && !plan) return { error: p.kind === "topup" ? "Unknown top-up pack." : "Unknown plan." };

  const decided = { status: approve ? "approved" : "rejected", decidedAt: new Date(), decidedBy: admin.name };
  const applied = await db.$transaction(async (tx) => {
    // claim it first: if two admins click at once, only one gets past here, so credits are never added twice
    const { count } = await tx.paymentRequest.updateMany({ where: { id, status: "submitted" }, data: decided });
    if (!count || !approve) return count > 0;
    if (pack) {
      await tx.user.update({ where: { id: p.userId }, data: { credits: { increment: pack.reviews } } });
    } else if (plan) {
      const user = (await tx.user.findUnique({ where: { id: p.userId }, select: { plan: true, planExpiresAt: true } }))!;
      const months = cycle === "yearly" ? 12 : 1;
      const expiresAt = extendFrom(user, plan.id, months);
      // new plan for the paid period + that plan's monthly AI reviews for every paid month (nothing refills them later)
      await tx.user.update({ where: { id: p.userId }, data: { plan: plan.id, planExpiresAt: expiresAt, credits: { increment: (plan.reviews ?? 0) * months } } });
      await tx.planChange.create({
        data: {
          userId: p.userId, fromPlan: activePlan(user.plan, user.planExpiresAt), toPlan: plan.id, months, expiresAt,
          source: "purchase", byName: admin.name, amount: p.amount, method: p.method,
        },
      });
    }
    return true;
  });
  if (!applied) return { error: "This payment was already reviewed." };
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Ads ----------
export async function decideAd(id: string, approve: boolean): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const { count } = await db.adRequest.updateMany({
    where: { id, paymentStatus: "submitted" },
    data: approve ? { paymentStatus: "approved", status: "running" } : { paymentStatus: "rejected", status: "rejected" },
  });
  if (!count) return { error: "This ad was already reviewed." };
  revalidatePath("/admin", "layout");
  return {};
}

export async function setAdDelivered(id: string, delivered: number): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const ad = await db.adRequest.findUnique({ where: { id }, select: { reviews: true, status: true } });
  if (!ad) return { error: "Ad not found." };
  if (ad.status !== "running" && ad.status !== "completed") return { error: "Approve the ad before updating delivery." };
  const n = Math.max(0, Math.min(ad.reviews, Math.floor(delivered)));
  const done = n >= ad.reviews;
  await db.adRequest.update({ where: { id }, data: { delivered: n, status: done ? "completed" : "running", completedAt: done ? new Date() : null } });
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Businesses ----------
// new end date: extend from the current end if they're already on this plan, otherwise from today
function extendFrom(current: { plan: string; planExpiresAt: Date | null }, plan: string, months: number) {
  const now = new Date();
  const base = current.plan === plan && current.planExpiresAt && current.planExpiresAt > now ? current.planExpiresAt : now;
  return addMonths(base, months);
}

// Free = no end date. Paid plans run for `months` (extending an active one of the same plan).
export async function setBusinessPlan(userId: string, plan: string, months: number): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return denied;
  if (!plans.some((p) => p.id === plan)) return { error: "Unknown plan." };
  const user = await db.user.findFirst({ where: { id: userId, role: "owner" }, select: { plan: true, planExpiresAt: true } });
  if (!user) return { error: "Business not found." };
  const m = plan === "free" ? 0 : Math.trunc(months);
  if (plan !== "free" && !(m >= 1 && m <= 36)) return { error: "Choose between 1 and 36 months." };
  const expiresAt = plan === "free" ? null : extendFrom(user, plan, m);
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { plan, planExpiresAt: expiresAt } }),
    db.planChange.create({
      data: { userId, fromPlan: activePlan(user.plan, user.planExpiresAt), toPlan: plan, months: m, expiresAt, source: "admin", byName: admin.name },
    }),
  ]);
  revalidatePath("/admin", "layout");
  return {};
}

export async function addCredits(userId: string, amount: number): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const n = Math.trunc(amount);
  if (!n || Math.abs(n) > 100_000) return { error: "Enter a number of credits (use a minus sign to remove)." };
  const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true, bonusCredits: true, plan: true, planExpiresAt: true } });
  if (!user) return { error: "Business not found." };
  // Free can't use extra plain credits past its monthly 5, so admin gifts go to bonus reviews there
  await db.user.update({
    where: { id: userId },
    data: activePlan(user.plan, user.planExpiresAt) === "free" ? { bonusCredits: Math.max(0, user.bonusCredits + n) } : { credits: Math.max(0, user.credits + n) },
  });
  revalidatePath("/admin", "layout");
  return {};
}

// the owner can't change this themselves once set
export async function changeGoogleLink(userId: string, url: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!isGoogleUrl(url.trim())) return { error: GOOGLE_URL_ERROR };
  const { count } = await db.reviewLink.updateMany({ where: { userId }, data: { googleReviewUrl: url.trim() } });
  if (!count) return { error: "This business hasn’t finished setup yet." };
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Support ----------
export async function staffReply(ticketId: string, body: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const text = body.trim();
  if (!text) return { error: "Write a message first." };
  if (text.length > 2000) return { error: "Please keep replies under 2000 characters." };
  const t = await db.ticket.findUnique({ where: { id: ticketId }, select: { status: true } });
  if (!t) return { error: "Ticket not found." };
  await db.ticket.update({
    where: { id: ticketId },
    data: { status: t.status === "open" ? "in_progress" : t.status, messages: { create: { body: text, fromStaff: true } } },
  });
  revalidatePath("/admin", "layout");
  return {};
}

export async function setTicketStatusAdmin(ticketId: string, status: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!["open", "in_progress", "resolved", "closed"].includes(status)) return { error: "Unknown status." };
  await db.ticket.update({ where: { id: ticketId }, data: { status } });
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Platform settings ----------
const url = z.union([z.literal(""), z.string().trim().max(200).regex(/^https:\/\/\S+$/, "Enter a full link starting with https://")]);
const sectionSchemas = {
  ads: z.object({
    adPrice: z.number().int().min(1, "Price must be at least Rs 1.").max(100_000),
    adMin: z.number().int().min(1, "Minimum must be at least 1 review.").max(100_000),
    adMax: z.number().int().min(1).max(100_000),
  }).refine((d) => d.adMin <= d.adMax, "Minimum can’t be more than the maximum."),
  accounts: z.object({
    signupCredits: z.number().int().min(0, "Credits can’t be negative.").max(100_000),
    signupsOpen: z.boolean(),
  }),
  support: z.object({
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid support email.")]),
    phone: z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number.")]),
    whatsapp: url,
    hours: z.string().trim().max(80),
  }),
  announcement: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(240, "Keep the announcement under 240 characters."),
    tone: z.enum(["info", "warning", "success"]),
  }).refine((d) => !d.enabled || d.text.length >= 3, "Write the announcement before turning it on."),
};
export type SettingsSection = keyof typeof sectionSchemas;

export async function savePlatformSection<K extends SettingsSection>(section: K, data: z.input<(typeof sectionSchemas)[K]>): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const parsed = sectionSchemas[section].safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data as Record<string, unknown>;
  if (section === "ads") await Promise.all([setSetting("adPrice", d.adPrice), setSetting("adLimits", { min: d.adMin, max: d.adMax })]);
  else await setSetting(section, d);
  revalidatePath("/", "layout"); // owner pages read these too
  return {};
}

// ---------- AI (OpenRouter) ----------
const aiSchema = z.object({
  apiKey: z.string().trim().max(200), // "" = keep the saved key
  clearKey: z.boolean(),
  model: z.string().trim().min(3, "Enter a model, e.g. openai/gpt-4o-mini").max(100).regex(/^[\w.:/-]+$/, "Model IDs look like provider/model-name."),
  temperature: z.number().min(0).max(2),
  enabled: z.boolean(),
});

export async function saveAiSettings(input: z.input<typeof aiSchema>): Promise<Result & { keyHint?: string }> {
  if (!(await requireAdmin())) return denied;
  const parsed = aiSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { apiKey, clearKey, ...rest } = parsed.data;
  const current = await db.setting.findUnique({ where: { key: "ai" } });
  const savedKey: string = current ? JSON.parse(current.value).apiKey ?? "" : "";
  const key = clearKey ? "" : apiKey || savedKey;
  await setSetting("ai", { ...rest, apiKey: key });
  return { keyHint: maskKey((await getAiConfig()).apiKey) };
}

// checks the key with OpenRouter and that the model exists; a typed key is tried before saving
export async function testAiConnection(draftKey: string, model: string): Promise<{ ok: boolean; message: string }> {
  if (!(await requireAdmin())) return { ok: false, message: denied.error };
  const key = draftKey.trim() || (await getAiConfig()).apiKey;
  if (!key) return { ok: false, message: "Add an API key first." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
    if (res.status === 401 || res.status === 403) return { ok: false, message: "OpenRouter rejected this API key." };
    if (!res.ok) return { ok: false, message: `OpenRouter answered ${res.status}. Try again in a moment.` };
    const info = (await res.json()).data ?? {};
    const models = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(10_000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const known = models?.data ? (models.data as { id: string }[]).some((m) => m.id === model.trim()) : true;
    if (!known) return { ok: false, message: `Key works, but “${model}” isn’t an OpenRouter model ID.` };
    const usage = typeof info.usage === "number" ? ` · $${info.usage.toFixed(2)} used` : "";
    const limit = typeof info.limit === "number" ? ` of $${info.limit.toFixed(2)}` : "";
    return { ok: true, message: `Connected${info.label ? ` as ${info.label}` : ""}${usage}${limit}.` };
  } catch {
    return { ok: false, message: "Couldn’t reach OpenRouter. Check the server’s internet connection." };
  }
}

const methodsSchema = z.array(z.object({
  id: z.string().regex(/^[a-z0-9-]{2,40}$/),
  label: z.string().trim().min(1, "Give every payment method a name.").max(40, "Keep method names under 40 characters."),
  type: z.enum(["wallet", "bank"]).optional(),
  enabled: z.boolean(),
  // small image data URL (or a path to a bundled sample image)
  qr: z.union([z.literal(""), z.string().regex(/^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|\/(?!\/)[\w./-]+)$/)]).refine((s) => s.length < 1_500_000, "QR image is too large."),
  details: z.array(z.object({
    label: z.string().trim().min(1, "Fill in every detail label (or remove the empty row).").max(40),
    value: z.string().trim().min(1, "Fill in every detail value (or remove the empty row).").max(80),
  })).max(6),
})).min(1, "Keep at least one payment method.").max(8, "Up to 8 payment methods.")
  .refine((ms) => new Set(ms.map((m) => m.label.toLowerCase())).size === ms.length, "Two payment methods have the same name.");

export async function savePaymentMethods(methods: PaymentMethod[]): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const parsed = methodsSchema.safeParse(methods);
  if (!parsed.success) return { error: parsed.error.issues[0].message || "Check the payment details." };
  if (!parsed.data.some((m) => m.enabled)) return { error: "Keep at least one payment method turned on." };
  await setSetting("methods", parsed.data);
  return {};
}

// ---------- Business profile actions (only on owner accounts, never on admins) ----------
async function ownerExists(userId: string) {
  return !!(await db.user.findFirst({ where: { id: userId, role: "owner" }, select: { id: true } }));
}
const notOwner = { error: "Business not found." };

export async function setSuspended(userId: string, suspended: boolean): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!(await ownerExists(userId))) return notOwner;
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { suspended, suspendedAt: suspended ? new Date() : null } }),
    ...(suspended ? [db.session.deleteMany({ where: { userId } })] : []), // log them out everywhere
  ]);
  revalidatePath("/admin", "layout");
  return {};
}

export async function changeBusinessEmail(userId: string, email: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!(await ownerExists(userId))) return notOwner;
  const e = email.trim().toLowerCase();
  if (!z.email().safeParse(e).success) return { error: "Enter a valid email address." };
  const taken = await db.user.findUnique({ where: { email: e }, select: { id: true } });
  if (taken && taken.id !== userId) return { error: "Another account already uses this email." };
  await db.user.update({ where: { id: userId }, data: { email: e } });
  revalidatePath("/admin", "layout");
  return {};
}

export async function resetBusinessPassword(userId: string, password: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!(await ownerExists(userId))) return notOwner;
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { userId } }), // old sessions shouldn't survive a reset
  ]);
  return {};
}

export async function logoutEverywhere(userId: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!(await ownerExists(userId))) return notOwner;
  await db.session.deleteMany({ where: { userId } });
  return {};
}

export async function saveAdminNote(userId: string, note: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!(await ownerExists(userId))) return notOwner;
  await db.user.update({ where: { id: userId }, data: { adminNote: note.trim().slice(0, 2000) } });
  return {};
}

// permanent: removes the business and everything linked to it (cascades)
export async function deleteBusiness(userId: string, confirmName: string): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const user = await db.user.findFirst({ where: { id: userId, role: "owner" }, select: { businessName: true } });
  if (!user) return notOwner;
  if (confirmName.trim() !== user.businessName) return { error: "Type the business name exactly to confirm." };
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Business details (edited from the business profile) ----------
const detailsSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short.").max(120),
  phone: z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number.")]),
  // "" = remove, otherwise a small JPEG data URL from PhotoUpload; leave out to keep
  photo: z.union([z.literal(""), z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "That photo couldn't be read.").max(400_000, "That photo is too large.")]),
  location: z.string().trim().max(120),
  description: z.string().trim().max(1000),
  products: z.array(z.string().trim().min(1).max(60)).max(30, "Up to 30 products or services."),
  tone: z.enum(["friendly", "professional", "enthusiastic"]),
  collectOnly: z.boolean(),
  detailsMode: z.enum(["required", "optional", "hidden"]),
  ...socialLinks,
}).partial();

export async function updateBusinessInfo(userId: string, patch: z.input<typeof detailsSchema>): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  if (!(await ownerExists(userId))) return notOwner;
  const parsed = detailsSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { businessName, phone, photo, products, collectOnly, detailsMode, ...rest } = parsed.data;

  const link = await db.reviewLink.findUnique({ where: { userId }, select: { slug: true, collectOnly: true } });
  if (!link && (products || collectOnly !== undefined || detailsMode || Object.keys(rest).length)) return { error: "This business hasn’t finished setup yet." };

  const collect = collectOnly ?? link?.collectOnly ?? false;
  // "Details only" always requires customer details
  const mode = collect ? "required" : detailsMode;
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        ...(businessName && { businessName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(photo === "" && { avatar: null, avatarAt: null }),
        ...(photo && { avatar: Buffer.from(photo.split(",")[1], "base64"), avatarAt: new Date() }),
      },
    }),
    ...(link ? [db.reviewLink.update({
      where: { userId },
      data: {
        ...rest,
        ...(businessName && { businessName }),
        ...(products && { products: JSON.stringify(products) }),
        ...(collectOnly !== undefined && { collectOnly }),
        ...(mode && { detailsOptional: mode === "optional", detailsHidden: mode === "hidden" }),
      },
    })] : []),
  ]);
  if (link) revalidatePath(`/r/${link.slug}`);
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Create accounts ----------
const phoneSchema = z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number.")]);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(128);

const newBusinessSchema = z.object({
  name: z.string().trim().min(2, "Enter the owner’s full name.").max(80),
  businessName: z.string().trim().min(2, "Enter the business name.").max(120),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  photo: z.union([z.literal(""), z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "That photo couldn’t be read.").max(400_000, "That photo is too large.")]),
  plan: z.enum(["free", "pro", "business"]),
  months: z.number().int().min(1, "Choose between 1 and 36 months.").max(36, "Choose between 1 and 36 months."),
  credits: z.number().int().min(0, "Credits can’t be negative.").max(100_000),
  // review page: leave the Google link empty to let the owner finish setup on first login
  googleReviewUrl: z.string().trim().refine((u) => !u || isGoogleUrl(u), GOOGLE_URL_ERROR),
  products: z.array(z.string().trim().min(1).max(60)).max(30, "Up to 30 products or services."),
  location: z.string().trim().max(120),
  description: z.string().trim().max(1000),
  tone: z.enum(["friendly", "professional", "enthusiastic"]),
  ...socialLinks,
  note: z.string().trim().max(2000),
}).refine((d) => !d.googleReviewUrl || d.products.length > 0, { message: "Add at least one product or service for the review page.", path: ["products"] });
export type NewBusiness = z.input<typeof newBusinessSchema>;

export async function createBusiness(input: NewBusiness): Promise<Result & { id?: string }> {
  const admin = await requireAdmin();
  if (!admin) return denied;
  const parsed = newBusinessSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email }, select: { id: true } })) return { error: "An account with this email already exists." };

  const user = await db.user.create({
    data: {
      name: d.name, businessName: d.businessName, email: d.email, passwordHash: await hashPassword(d.password),
      phone: d.phone || null, credits: d.credits, adminNote: d.note, planChosenAt: new Date(), // the admin already picked their plan
      emailVerifiedAt: new Date(), // set up by our team, no code needed
      plan: d.plan, planExpiresAt: d.plan === "free" ? null : addMonths(new Date(), d.months),
      ...(d.plan !== "free" && {
        planChanges: { create: { fromPlan: "free", toPlan: d.plan, months: d.months, expiresAt: addMonths(new Date(), d.months), source: "created", byName: admin.name } },
      }),
      ...(d.photo && { avatar: Buffer.from(d.photo.split(",")[1], "base64"), avatarAt: new Date() }),
      ...(d.googleReviewUrl && {
        link: {
          create: {
            businessName: d.businessName, slug: slugFor(d.businessName), googleReviewUrl: d.googleReviewUrl,
            products: JSON.stringify(d.products), location: d.location, description: d.description, tone: d.tone,
            facebookUrl: d.facebookUrl, instagramUrl: d.instagramUrl, tiktokUrl: d.tiktokUrl, websiteUrl: d.websiteUrl,
          },
        },
      }),
    },
    select: { id: true },
  });
  revalidatePath("/admin", "layout");
  return { id: user.id };
}

const newAdminSchema = z.object({
  name: z.string().trim().min(2, "Enter a full name.").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export async function createAdmin(input: z.input<typeof newAdminSchema>): Promise<Result> {
  if (!(await requireAdmin())) return denied;
  const parsed = newAdminSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) return { error: "An account with this email already exists." };
  await db.user.create({ data: { name, email, businessName: "Give Me Five Star", role: "super_admin", credits: 0, passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/users");
  return {};
}

async function otherAdmin(id: string) {
  const me = await requireAdmin();
  if (!me) return { error: denied.error };
  if (id === me.id) return { error: "You can’t do that to your own account here. Use your profile settings." };
  if (!(await db.user.findFirst({ where: { id, role: "super_admin" }, select: { id: true } }))) return { error: "Admin not found." };
  return {};
}

export async function resetAdminPassword(id: string, password: string): Promise<Result> {
  const check = await otherAdmin(id);
  if (check.error) return check;
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.$transaction([
    db.user.update({ where: { id }, data: { passwordHash: await hashPassword(parsed.data) } }),
    db.session.deleteMany({ where: { userId: id } }), // signed out everywhere
  ]);
  return {};
}

export async function removeAdmin(id: string): Promise<Result> {
  const check = await otherAdmin(id);
  if (check.error) return check;
  if ((await db.user.count({ where: { role: "super_admin" } })) <= 1) return { error: "Keep at least one super admin." };
  await db.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return {};
}
