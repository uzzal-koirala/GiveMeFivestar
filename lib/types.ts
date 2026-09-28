// Shapes the dashboard UI works with (mapped from database rows in lib/data.ts)

export type Customer = {
  id: string;
  name: string;
  phone: string;
  location: string;
  product: string;
  review: string; // AI review the customer copied; empty for feedback / imported customers
  date: string; // ISO
  adId?: string; // set when the review came from an ad campaign (otherwise from the QR/link)
  rating?: number; // 1-5 stars the customer gave
  feedback?: string; // customer's own comment (feedback mode)
  source?: "qr" | "import";
};

export type AdStatus = "pending" | "running" | "completed" | "rejected";
export type Ad = {
  id: string;
  reviews: number;
  delivered: number;
  pricePerReview: number; // locked in when requested
  notes: string;
  status: AdStatus;
  payment?: { method: string; txnId: string; proofName: string; status: string };
  createdAt: string;
  completedAt?: string;
};

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "urgent";
export type TicketMessage = { id: string; from: "you" | "support"; name: string; body: string; at: string; attachment?: string; attachmentUrl?: string };
export type Ticket = {
  id: string;
  code: string; // short human-friendly id shown in the UI, e.g. TCK-3F9A
  business?: string; // shown to the super admin
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type PaymentRequestView = { id: string; kind: string; item: string; amount: number; method: string; status: string; createdAt: string };
