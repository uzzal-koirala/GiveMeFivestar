"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Owner closes a "payment approved" notice (only their own)
export async function dismissPaymentNotice(source: "payment" | "ad", id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const where = { id, userId: user.id };
  if (source === "ad") await db.adRequest.updateMany({ where, data: { noticeSeen: true } });
  else await db.paymentRequest.updateMany({ where, data: { noticeSeen: true } });
  revalidatePath("/dashboard", "layout");
}
