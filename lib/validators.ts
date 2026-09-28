import { TONES } from "@/lib/tones";
import { DETAILS_MODES } from "@/lib/details-mode";
import { z } from "zod";

export const createLinkSchema = z.object({
  businessName: z.string().min(1),
  googleReviewUrl: z.string().url(),
  products: z.array(z.string()).default([]),
});

// Public review page: what the customer fills in
const customerDetails = {
  customerName: z.string().trim().min(2, "Enter your full name.").max(80),
  customerPhone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number."),
  location: z.string().trim().min(2, "Enter your location.").max(80),
};
const experience = {
  slug: z.string().min(1),
  product: z.string().trim().min(1, "Tell us what you bought or tried.").max(60),
  rating: z.coerce.number().int().min(1, "Tap the stars to rate your experience.").max(5),
  feedback: z.string().trim().max(1000, "Please keep your comment under 1000 characters.").default(""),
};
export const customerFormSchema = z.object({ ...experience, ...customerDetails });
// when the business lets customers skip "Tell us about you": each detail may be empty, but must be valid if given
export const customerFormOptionalSchema = z.object({
  ...experience,
  customerName: z.union([z.literal(""), customerDetails.customerName]),
  customerPhone: z.union([z.literal(""), customerDetails.customerPhone]),
  location: z.union([z.literal(""), customerDetails.location]),
});

// Settings -> Customer review page
const socialUrl = (hosts: string[], name: string) =>
  z.string().trim().refine((u) => {
    if (!u) return true;
    try {
      const { protocol, hostname } = new URL(u);
      return protocol === "https:" && hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
    } catch {
      return false;
    }
  }, `Enter your ${name} page link (starting with https://).`);

export const socialLinks = {
  facebookUrl: socialUrl(["facebook.com", "fb.com"], "Facebook"),
  instagramUrl: socialUrl(["instagram.com"], "Instagram"),
  tiktokUrl: socialUrl(["tiktok.com"], "TikTok"),
  websiteUrl: z.string().trim().max(200).refine((u) => {
    if (!u) return true;
    try {
      const { protocol, hostname } = new URL(u);
      return (protocol === "https:" || protocol === "http:") && hostname.includes(".");
    } catch {
      return false;
    }
  }, "Enter the full website address, e.g. https://yourbusiness.com"),
};

export const reviewPageSchema = z.object({
  detailsMode: z.enum(DETAILS_MODES),
  collectOnly: z.enum(["on", "off"]).transform((v) => v === "on"),
  ...socialLinks,
});

export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  businessName: z.string().trim().min(2, "Enter your business name.").max(120),
  email,
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

// Google review links come from a small set of Google hosts
const GOOGLE_HOSTS = ["g.page", "google.com", "goo.gl", "maps.app.goo.gl", "business.google.com", "search.google.com"];
export const isGoogleUrl = (u: string) => {
  try {
    const { protocol, hostname } = new URL(u);
    return protocol === "https:" && GOOGLE_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

export const GOOGLE_URL_ERROR = "Paste the review link from your Google Business Profile (it starts with https://g.page/ or a Google address).";

// step 1: business, step 2: profile
export const ONBOARDING_STEP: Record<string, 1 | 2> = { googleReviewUrl: 1, products: 1, tone: 1, description: 1, phone: 2, photo: 2, websiteUrl: 2, facebookUrl: 2, instagramUrl: 2, tiktokUrl: 2 };

export const onboardingSchema = z.object({
  googleReviewUrl: z.string().trim().refine(isGoogleUrl, GOOGLE_URL_ERROR),
  // JSON array from the tag input, e.g. ["Haircut","Facial"]
  products: z
    .string()
    .transform((s, ctx) => {
      try { return JSON.parse(s) as unknown; } catch { ctx.addIssue({ code: "custom", message: "Add at least one product or service." }); return z.NEVER; }
    })
    .pipe(z.array(z.string().trim().min(1).max(60), "Add at least one product or service.").min(1, "Add at least one product or service.").max(30, "Add up to 30 products or services.")),
  tone: z.enum(TONES.map((t) => t.id) as [string, ...string[]], "Choose a review tone."),
  description: z.string().trim().min(20, "Tell us a bit more about your business (at least 20 characters).").max(1000),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number."),
  // optional avatar: small JPEG data URL produced by PhotoUpload
  photo: z.union([z.literal(""), z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "That photo couldn't be read.").max(400_000, "That photo is too large.")]).default(""),
  // optional: shown as buttons on the review page
  websiteUrl: socialLinks.websiteUrl.default(""),
  facebookUrl: socialLinks.facebookUrl.default(""),
  instagramUrl: socialLinks.instagramUrl.default(""),
  tiktokUrl: socialLinks.tiktokUrl.default(""),
});
