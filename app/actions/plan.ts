"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// The plan step after sign-up: Free goes straight on; paid plans wait for the admin to approve the payment.

export async function chooseFreePlan(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  await db.$transaction([
    db.user.updateMany({ where: { id: user.id, planChosenAt: null }, data: { planChosenAt: new Date() } }),
    // an earlier rejected payment was already explained on the plan screen
    db.paymentRequest.updateMany({ where: { userId: user.id, status: "rejected" }, data: { noticeSeen: true } }),
  ]);
  revalidatePath("/dashboard", "layout");
  return {};
}

// after the "Congratulations" screen: only once their plan payment really was approved
export async function finishPlanStep(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const last = await db.paymentRequest.findFirst({ where: { userId: user.id, kind: "plan" }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
  if (last?.status !== "approved") return { error: "Your payment hasn’t been approved yet." };
  await db.$transaction([
    db.user.updateMany({ where: { id: user.id, planChosenAt: null }, data: { planChosenAt: new Date() } }),
    db.paymentRequest.updateMany({ where: { userId: user.id, status: { not: "submitted" } }, data: { noticeSeen: true } }),
  ]);
  revalidatePath("/dashboard", "layout");
  return {};
}
