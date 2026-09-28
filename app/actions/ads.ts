"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toAd } from "@/lib/data";
import { readUpload } from "@/lib/uploads";
import { enabledMethods, getPlatform } from "@/lib/platform";
import type { Ad } from "@/lib/types";

const schema = z.object({
  reviews: z.coerce.number().int(),
  notes: z.string().trim().max(500).default(""),
  method: z.string(),
  txnId: z.string().trim().max(80).default(""),
});

// New ad request with its manual payment proof; the super admin verifies and starts it
export async function requestAd(form: FormData): Promise<{ error?: string; ad?: Ad }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const parsed = schema.safeParse(Object.fromEntries([...form].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const proof = await readUpload(form.get("proof"));
  if (proof.error || !proof.file) return { error: proof.error ?? "Please upload your payment proof." };

  const { reviews, notes, method, txnId } = parsed.data;
  const platform = await getPlatform();
  if (reviews < platform.adMin || reviews > platform.adMax) return { error: `Choose between ${platform.adMin} and ${platform.adMax} reviews.` };
  if (!enabledMethods(platform).some((m) => m.id === method)) return { error: "Choose how you paid." };
  const ad = await db.adRequest.create({
    data: {
      userId: user.id, reviews, notes, pricePerReview: platform.adPrice, // price locked at request time
      paymentMethod: method, paymentRef: txnId, paymentProof: proof.file.name, paymentProofType: proof.file.type, paymentProofData: proof.file.data,
    },
    omit: { paymentProofData: true },
  });
  return { ad: toAd(ad) };
}
