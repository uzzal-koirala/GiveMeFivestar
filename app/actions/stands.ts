"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { readUpload } from "@/lib/uploads";
import { enabledMethods, getPlatform } from "@/lib/platform";
import { PROVINCES, STAND_MAX, STAND_PRICE } from "@/lib/site";

export type StandOrderView = {
  id: string; quantity: number; amount: number; design: string; designName: string | null; status: string;
  fullName: string; phone: string; address: string; createdAt: string; shippedAt: string | null; deliveredAt: string | null;
};

const orderSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Order at least 1 stand.").max(STAND_MAX, `Up to ${STAND_MAX} stands per order.`),
  design: z.enum(["standard", "custom"]),
  fullName: z.string().trim().min(2, "Enter the receiver’s full name.").max(80),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number for delivery."),
  province: z.enum(PROVINCES as [string, ...string[]], "Choose a province."),
  district: z.string().trim().min(2, "Enter the district.").max(60),
  city: z.string().trim().min(2, "Enter the city or municipality.").max(60),
  address: z.string().trim().min(5, "Enter the full address (tole, street, house).").max(200),
  landmark: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(500).default(""),
  method: z.string(),
  txnId: z.string().trim().max(80).default(""),
});

// Owner orders stands: delivery details, optional own design and the payment proof, in one go
export async function orderStands(form: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const parsed = orderSchema.safeParse(Object.fromEntries([...form].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!enabledMethods(await getPlatform()).some((m) => m.id === d.method)) return { error: "Choose how you paid." };

  const design = d.design === "custom" ? await readUpload(form.get("designFile")) : { file: null };
  if (design.error) return { error: `Design: ${design.error}` };
  if (d.design === "custom" && !design.file) return { error: "Upload your design, or choose our standard design." };
  const proof = await readUpload(form.get("proof"));
  if (proof.error || !proof.file) return { error: proof.error ?? "Please upload your payment proof." };

  const { method, txnId, ...rest } = d;
  await db.standOrder.create({
    data: {
      userId: user.id, ...rest, amount: d.quantity * STAND_PRICE, method, txnId, // price from the server, never the browser
      ...(design.file && { designName: design.file.name, designType: design.file.type, designData: design.file.data }),
      proofName: proof.file.name, proofType: proof.file.type, proofData: proof.file.data,
    },
  });
  revalidatePath("/dashboard/settings");
  return {};
}

// ---------- super admin ----------
const NEXT: Record<string, string[]> = { submitted: ["printing", "rejected"], printing: ["shipped"], shipped: ["delivered"] };

export async function updateStandOrder(id: string, status: "printing" | "rejected" | "shipped" | "delivered"): Promise<{ error?: string }> {
  const admin = await getCurrentUser();
  if (admin?.role !== "super_admin") return { error: "Only a super admin can do that." };
  const order = await db.standOrder.findUnique({ where: { id }, select: { status: true } });
  if (!order) return { error: "Order not found." };
  if (!NEXT[order.status]?.includes(status)) return { error: "This order already moved on. Refresh to see its latest status." };
  const now = new Date();
  await db.standOrder.update({
    where: { id },
    data: {
      status,
      ...((status === "printing" || status === "rejected") && { decidedAt: now, decidedBy: admin.name }),
      ...(status === "shipped" && { shippedAt: now }),
      ...(status === "delivered" && { deliveredAt: now }),
    },
  });
  revalidatePath("/admin", "layout");
  return {};
}
