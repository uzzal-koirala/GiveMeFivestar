// Loads the signed-in business's real data and maps it to the shapes the dashboard UI uses
import "server-only";
import { db } from "@/lib/db";
import { activePlan, aiReviewsLeft, planOf } from "@/lib/site";
import type { Ad, AdStatus, Customer, PaymentRequestView, Ticket, TicketPriority, TicketStatus } from "@/lib/types";

const shortCode = (prefix: string, id: string) => `${prefix}-${id.slice(-6).toUpperCase()}`;

export const parseProducts = (raw: string): string[] => {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  } catch {
    return [];
  }
};

export const getLink = (userId: string) => db.reviewLink.findUnique({ where: { userId } });

// Everyone who used the review page (plus CSV imports), newest first
export async function getCustomers(userId: string): Promise<Customer[]> {
  const rows = await db.submission.findMany({ where: { link: { userId } }, orderBy: { createdAt: "desc" } });
  return rows.map((s) => ({
    id: s.id,
    name: s.customerName || "Anonymous",
    phone: s.customerPhone,
    location: s.location,
    product: s.product,
    review: s.generatedText,
    date: s.createdAt.toISOString(),
    rating: s.rating,
    feedback: s.feedback,
    source: s.source === "import" ? "import" : "qr",
    ...(s.adId && { adId: s.adId }),
  }));
}

export const toAd = (a: {
  id: string; reviews: number; delivered: number; pricePerReview: number; notes: string; status: string; createdAt: Date; completedAt: Date | null;
  paymentMethod: string | null; paymentRef: string | null; paymentProof: string | null; paymentStatus: string;
}): Ad => ({
  id: shortCode("AD", a.id),
  reviews: a.reviews,
  delivered: a.delivered,
  pricePerReview: a.pricePerReview,
  notes: a.notes,
  status: a.status as AdStatus,
  createdAt: a.createdAt.toISOString(),
  ...(a.completedAt && { completedAt: a.completedAt.toISOString() }),
  ...(a.paymentMethod && { payment: { method: a.paymentMethod, txnId: a.paymentRef ?? "", proofName: a.paymentProof ?? "", status: a.paymentStatus } }),
});

export async function getAds(userId: string): Promise<Ad[]> {
  const rows = await db.adRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, omit: { paymentProofData: true } });
  return rows.map(toAd);
}

type TicketRow = {
  id: string; subject: string; category: string; priority: string; status: string; createdAt: Date; updatedAt: Date;
  messages: { id: string; fromStaff: boolean; body: string; attachment: string | null; createdAt: Date }[];
};
export const toTicket = (t: TicketRow, ownerName: string): Ticket => ({
  id: t.id,
  code: shortCode("TCK", t.id),
  subject: t.subject,
  category: t.category,
  priority: t.priority as TicketPriority,
  status: t.status as TicketStatus,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
  messages: t.messages.map((m) => ({
    id: m.id,
    from: m.fromStaff ? "support" : "you",
    name: m.fromStaff ? "Give Me Five Star Support" : ownerName,
    body: m.body,
    at: m.createdAt.toISOString(),
    ...(m.attachment && { attachment: m.attachment, attachmentUrl: `/api/files/ticket/${m.id}` }),
  })),
});

export const TICKET_MESSAGES = {
  orderBy: { createdAt: "asc" as const },
  select: { id: true, fromStaff: true, body: true, attachment: true, createdAt: true },
};

export async function getTickets(userId: string, ownerName: string): Promise<Ticket[]> {
  const rows = await db.ticket.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, include: { messages: TICKET_MESSAGES } });
  return rows.map((t) => toTicket(t, ownerName));
}

export async function getPayments(userId: string): Promise<PaymentRequestView[]> {
  const rows = await db.paymentRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, omit: { proofData: true } });
  return rows.map((p) => ({ id: p.id, kind: p.kind, item: p.item, amount: p.amount, method: p.method, status: p.status, createdAt: p.createdAt.toISOString() }));
}

// AI reviews generated since the 1st of this month
export async function aiReviewsThisMonth(userId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return db.submission.count({ where: { link: { userId }, source: "qr", generatedText: { not: "" }, createdAt: { gte: start } } });
}

// Can this business take another customer review right now?
// Unlimited plans always can. Otherwise an AI review needs a credit, and a Free feedback-only page
// is capped at the plan's monthly number so switching modes can't get around the limit.
export async function reviewPageStatus(userId: string, collectOnly: boolean): Promise<{ open: boolean; reason?: "credits" | "limit"; limit?: number }> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true, credits: true, bonusCredits: true } });
  if (!u) return { open: false, reason: "credits" };
  const plan = planOf(activePlan(u.plan, u.planExpiresAt));
  if (plan.reviews === null) return { open: true };
  if (!collectOnly) {
    if (plan.id !== "free") return u.credits + u.bonusCredits > 0 ? { open: true } : { open: false, reason: "credits" };
    const left = aiReviewsLeft(plan.id, u.credits, await aiReviewsThisMonth(userId), u.bonusCredits);
    return left ? { open: true } : { open: false, reason: u.credits > 0 ? "limit" : "credits", limit: plan.reviews };
  }
  if (plan.id !== "free") return { open: true };
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const used = await db.submission.count({ where: { link: { userId }, source: "qr", createdAt: { gte: start } } });
  return used < plan.reviews ? { open: true } : { open: false, reason: "limit", limit: plan.reviews };
}
