"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Customer } from "@/lib/types";

const row = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(30),
  location: z.string().trim().max(80),
  product: z.string().trim().max(60),
  date: z.string(), // ISO
});

// Save customers from a CSV file. They count as customers, not as reviews or feedback.
export async function importCustomers(rows: unknown): Promise<{ error?: string; imported?: Customer[] }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const parsed = z.array(row).max(1000, "You can import up to 1,000 customers at a time.").safeParse(rows);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const link = await db.reviewLink.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!link) return { error: "Finish your business setup before importing customers." };

  const created = await db.submission.createManyAndReturn({
    data: parsed.data.map((r) => {
      const d = new Date(r.date);
      return {
        linkId: link.id, source: "import", rating: 0,
        customerName: r.name, customerPhone: r.phone, location: r.location, product: r.product || "—",
        createdAt: isNaN(d.getTime()) || d > new Date() ? new Date() : d,
      };
    }),
  });
  return {
    imported: created.map((s) => ({
      id: s.id, name: s.customerName, phone: s.customerPhone, location: s.location, product: s.product,
      review: "", date: s.createdAt.toISOString(), rating: 0, source: "import",
    })),
  };
}
