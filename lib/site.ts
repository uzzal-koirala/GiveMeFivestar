// Site-wide contact info and navigation — edit here, used by header/footer
export const site = {
  name: "Give Me Five Star",
  country: "Nepal",
  phone: "+977-9747796721",
  phoneHours: "(Sun–Fri, 10:00 AM – 6:00 PM)",
  whatsapp: "https://wa.me/9779747796721",
  supportEmail: "support@givemefivestar.com",
  socials: {
    facebook: "#",
    linkedin: "#",
    instagram: "#",
    x: "#",
    tiktok: "#",
  },
};

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

// Header menu: only real sections and pages
export const nav: NavItem[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/#contact" },
];

// social links still set to "#" are placeholders and stay hidden
export const realLink = (href: string) => !!href && href !== "#";

// AI review top-up packs (prices in NPR). TODO: set real prices
export const creditPacks = [
  { id: "starter", reviews: 100, price: 299 },
  { id: "growth", reviews: 500, price: 999, popular: true },
  { id: "pro", reviews: 1500, price: 2499 },
];

// Subscription plans (prices in NPR per month). reviews = AI reviews per month, customers = saved customers; null = unlimited
export type Plan = { id: string; name: string; price: number; reviews: number | null; customers: number | null; popular?: boolean; features: string[] };
export const plans: Plan[] = [
  { id: "free", name: "Free", price: 0, reviews: 5, customers: 5, features: ["5 AI reviews / month", "Up to 5 customers in your list", "Customer list & filters", "Email support", "Give Me Five Star badge on your review page"] },
  { id: "pro", name: "Pro", price: 999, reviews: 100, customers: 100, popular: true, features: ["100 AI reviews / month", "Up to 100 customers in your list", "No Give Me Five Star badge, fully your brand", "Your colours & photo on the review page", "Custom AI instructions", "CSV import & export", "Priority WhatsApp support"] },
  { id: "business", name: "Business", price: 2499, reviews: null, customers: null, features: ["Unlimited AI reviews", "Unlimited customer data", "Everything in Pro", "Detailed review insights", "Dedicated account manager"] },
];
export const planOf = (id: string) => plans.find((p) => p.id === id) ?? plans[0];

// AI reviews the plan itself still allows: Free is capped per calendar month, paid plans spend credits, null = unlimited
export function planReviewsLeft(planId: string, credits: number, usedThisMonth: number): number | null {
  const p = planOf(planId);
  if (p.reviews === null) return null;
  if (p.id === "free") return Math.max(0, Math.min(credits, p.reviews - usedThisMonth));
  return Math.max(0, credits);
}
// ...plus bonus AI reviews a super admin gave (used after the plan's own, never reset)
export function aiReviewsLeft(planId: string, credits: number, usedThisMonth: number, bonus = 0): number | null {
  const own = planReviewsLeft(planId, credits, usedThisMonth);
  return own === null ? null : own + Math.max(0, bonus);
}
// first day of next month, when the Free allowance starts again
export const nextMonthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 1); };
export const YEARLY_MONTHS = 10; // yearly = pay 10 months, get 12

// Ads: price per delivered review (NPR). Placeholder — the super admin will set this.
export const AD_PRICE_PER_REVIEW = 25;
export const AD_MIN_REVIEWS = 10;
export const AD_MAX_REVIEWS = 1000;

// Manual payments (no gateway yet): where customers send money.
// `qr` is the payment QR the super admin uploads (optional — hidden when empty).
// TODO: replace with real accounts; the sample QRs in /public/payments are placeholders
type ManualPaymentOption = { id: string; label: string; qr?: string; details: { label: string; value: string }[] };
export const manualPayments: ManualPaymentOption[] = [
  { id: "esewa", label: "eSewa", qr: "/payments/esewa-qr.png", details: [{ label: "eSewa ID", value: "9800000000" }, { label: "Name", value: "Give Me Five Star Pvt. Ltd." }] },
  { id: "khalti", label: "Khalti", qr: "/payments/khalti-qr.png", details: [{ label: "Khalti ID", value: "9800000000" }, { label: "Name", value: "Give Me Five Star Pvt. Ltd." }] },
  { id: "bank", label: "Bank transfer", qr: "/payments/bank-qr.png", details: [{ label: "Bank", value: "Nabil Bank" }, { label: "Account name", value: "Give Me Five Star Pvt. Ltd." }, { label: "Account no.", value: "0000000000000000" }] },
];

export const TICKET_CATEGORIES = ["Billing & payments", "Ads", "Google link change", "AI reviews", "Technical issue", "Account", "Other"];

// A paid plan counts only until it expires; after that the business is on Free
export const activePlan = (plan: string, expiresAt: Date | null | undefined) =>
  plan !== "free" && expiresAt && expiresAt.getTime() < Date.now() ? "free" : plan;

export const addMonths = (from: Date, months: number) => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
};

// older saved payment methods have no type; the built-in "bank" one is a bank
export const isBank = (m: { id: string; type?: "wallet" | "bank" }) => (m.type ?? (m.id === "bank" ? "bank" : "wallet")) === "bank";

// ---- Review page design (Pro and Business) ----
export const DEFAULT_THEME = "#172554"; // navy (blue-950)
export const THEME_COLORS = ["#172554", "#1e40af", "#0f766e", "#15803d", "#9f1239", "#b45309", "#6d28d9", "#0f172a"];
export const canDesignPage = (plan: string) => plan === "pro" || plan === "business";
// white text on dark colours, dark text on light ones (WCAG relative luminance)
export function textOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#0f172a" : "#ffffff";
}

// ---- QR code stands ----
export const STAND_PRICE = 1000; // NPR each, free delivery anywhere in Nepal
export const STAND_MAX = 20;
export const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
export const STAND_STEPS = [
  { id: "submitted", label: "Payment check" },
  { id: "printing", label: "Printing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
] as const;

// Contact form on the home page
export const CONTACT_TOPICS = ["General question", "Pricing & plans", "Set up help", "QR stands", "Partnership", "Job application", "Other"] as const;

// Public site address, for SEO links (set NEXT_PUBLIC_SITE_URL in production)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://givemefivestar.com").replace(/\/$/, "");
export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"] as const;
