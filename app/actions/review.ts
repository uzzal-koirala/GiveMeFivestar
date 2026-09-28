"use server";

import { activePlan, planOf, planReviewsLeft } from "@/lib/site";
import { aiReviewsThisMonth, parseProducts, reviewPageStatus } from "@/lib/data";
import { db } from "@/lib/db";
import { generateReviews } from "@/lib/ai";
import { customerFormOptionalSchema, customerFormSchema } from "@/lib/validators";

export type ReviewState =
  | { error?: string; step?: 1 | 2; fields?: Record<string, string>; submissionId?: string; reviews?: string[]; rating?: number; thanks?: boolean }
  | undefined;

// which screen of the customer flow each field lives on
const STEP: Record<string, 1 | 2> = { customerName: 1, customerPhone: 1, location: 1, product: 2, rating: 2 };

// Customer submits their details + rating -> save the submission and return review drafts
export async function writeReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const fields = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]));
  const link = await db.reviewLink.findUnique({ where: { slug: fields.slug ?? "" }, include: { user: { select: { suspended: true } } } });
  if (!link || link.user.suspended) return { error: "This review link is no longer active.", fields };

  // "Details only" always requires the details, whatever else is stored
  const hidden = link.detailsHidden && !link.collectOnly;
  const optional = link.detailsOptional && !link.collectOnly;
  if (hidden) Object.assign(fields, { customerName: "", customerPhone: "", location: "" });
  const parsed = (optional || hidden ? customerFormOptionalSchema : customerFormSchema).safeParse(fields);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, step: STEP[String(issue.path[0])] ?? 1, fields };
  }
  const { customerName, customerPhone, location, product, rating, feedback } = parsed.data;

  const status = await reviewPageStatus(link.userId, link.collectOnly);
  if (!status.open) return { error: `${link.businessName} isn't accepting reviews right now. Please let the staff know.`, step: 2, fields };

  // collect-only businesses just keep the details and show a thank-you (no AI, no Google)
  if (link.collectOnly) {
    await db.submission.create({ data: { linkId: link.id, customerName, customerPhone, location, product, rating, feedback } });
    return { thanks: true, rating, fields };
  }

  // each AI review uses one of the business's credits (atomic, so it can't go below zero); unlimited plans skip this
  const owner = await db.user.findUnique({ where: { id: link.userId }, select: { plan: true, planExpiresAt: true, credits: true } });
  const planId = activePlan(owner?.plan ?? "free", owner?.planExpiresAt);
  const own = planReviewsLeft(planId, owner?.credits ?? 0, planId === "free" ? await aiReviewsThisMonth(link.userId) : 0);
  // the plan's own allowance first, then bonus reviews from the super admin
  const charged = own === null ? { count: 1 }
    : own > 0 ? await db.user.updateMany({ where: { id: link.userId, credits: { gt: 0 } }, data: { credits: { decrement: 1 } } })
    : await db.user.updateMany({ where: { id: link.userId, bonusCredits: { gt: 0 } }, data: { bonusCredits: { decrement: 1 } } });
  if (!charged.count) return { error: "Sorry, reviews are unavailable right now. Please ask the staff for help.", step: 2, fields };

  const reviews = await generateReviews({
    businessName: link.businessName, description: link.description, product, rating,
    tone: link.tone, language: link.language, instructions: link.aiInstructions, keywords: parseProducts(link.keywords),
  });
  const submission = await db.submission.create({
    data: { linkId: link.id, customerName, customerPhone, location, product, rating, generatedText: reviews[0] },
  });
  return { submissionId: submission.id, reviews, rating, fields };
}

// Remember which (possibly edited) review the customer actually copied
export async function saveChosenReview(submissionId: string, text: string) {
  const clean = text.trim().slice(0, 2000);
  if (!clean) return;
  // only while the customer is still on the page, so an old id can't be used to rewrite a review later
  await db.submission.updateMany({ where: { id: submissionId, source: "qr", createdAt: { gt: new Date(Date.now() - 60 * 60_000) } }, data: { generatedText: clean } });
}
