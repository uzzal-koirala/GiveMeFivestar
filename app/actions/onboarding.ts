"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugFor } from "@/lib/slug";
import { ONBOARDING_STEP, onboardingSchema } from "@/lib/validators";

export type OnboardingState = { error?: string; step?: 1 | 2; fields?: Record<string, string>; done?: boolean } | undefined;

export async function completeOnboarding(_: OnboardingState, form: FormData): Promise<OnboardingState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const fields = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]));
  const parsed = onboardingSchema.safeParse(fields);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // send the user back to the step that has the problem; don't echo the photo back
    return { error: issue.message, step: ONBOARDING_STEP[String(issue.path[0])] ?? 1, fields: { ...fields, photo: "" } };
  }

  // the Google link can only be set once; changes go through the super admin
  if (await db.reviewLink.findUnique({ where: { userId: user.id } })) {
    return { error: "Your Google review link is already set. Contact support to change it." };
  }

  const { googleReviewUrl, products, tone, description, phone, photo, websiteUrl, facebookUrl, instagramUrl, tiktokUrl } = parsed.data;
  const avatar = photo ? Buffer.from(photo.split(",")[1], "base64") : undefined;
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { phone, ...(avatar && { avatar, avatarAt: new Date() }) } }),
    db.reviewLink.create({
      data: { userId: user.id, businessName: user.businessName, slug: slugFor(user.businessName), googleReviewUrl, products: JSON.stringify(products), tone, description, websiteUrl, facebookUrl, instagramUrl, tiktokUrl },
    }),
  ]);

  revalidatePath("/dashboard", "layout");
  return { done: true };
}
