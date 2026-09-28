// Settings the super admin controls, stored in the Setting table (defaults come from lib/site.ts)
import "server-only";
import { db } from "@/lib/db";
import { AD_MAX_REVIEWS, AD_MIN_REVIEWS, AD_PRICE_PER_REVIEW, manualPayments, site } from "@/lib/site";

export type PaymentMethod = { id: string; label: string; type?: "wallet" | "bank"; enabled: boolean; qr: string; details: { label: string; value: string }[] };
export type SupportContact = { email: string; phone: string; whatsapp: string; hours: string };
export type Announcement = { enabled: boolean; text: string; tone: "info" | "warning" | "success" };
export type Platform = {
  adPrice: number; adMin: number; adMax: number;
  signupCredits: number; signupsOpen: boolean;
  support: SupportContact; announcement: Announcement;
  methods: PaymentMethod[];
};
// never sent to the browser as-is: the admin page gets a masked view
export type AiConfig = { enabled: boolean; apiKey: string; model: string; temperature: number };

const DEFAULT_METHODS: PaymentMethod[] = manualPayments.map((m) => ({ id: m.id, label: m.label, enabled: true, qr: m.qr ?? "", details: m.details }));
const DEFAULT_SUPPORT: SupportContact = { email: site.supportEmail, phone: site.phone, whatsapp: site.whatsapp, hours: site.phoneHours };
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

async function read(keys: string[]) {
  const rows = await db.setting.findMany({ where: { key: { in: keys } } });
  return <T,>(k: string, fallback: T): T => {
    const v = rows.find((r) => r.key === k)?.value;
    return v === undefined ? fallback : (JSON.parse(v) as T);
  };
}

export async function getPlatform(): Promise<Platform> {
  const get = await read(["adPrice", "adLimits", "accounts", "support", "announcement", "methods"]);
  const limits = get("adLimits", { min: AD_MIN_REVIEWS, max: AD_MAX_REVIEWS });
  const accounts = get("accounts", { signupCredits: 100, signupsOpen: true });
  return {
    adPrice: Number(get("adPrice", AD_PRICE_PER_REVIEW)),
    adMin: limits.min, adMax: limits.max,
    signupCredits: accounts.signupCredits, signupsOpen: accounts.signupsOpen,
    support: { ...DEFAULT_SUPPORT, ...get<Partial<SupportContact>>("support", {}) },
    announcement: get<Announcement>("announcement", { enabled: false, text: "", tone: "info" }),
    methods: get("methods", DEFAULT_METHODS),
  };
}

// AI settings saved by the admin win; environment variables are the fallback
export async function getAiConfig(): Promise<AiConfig> {
  const get = await read(["ai"]);
  const saved = get<Partial<AiConfig>>("ai", {});
  return {
    enabled: saved.enabled ?? true,
    apiKey: saved.apiKey || process.env.OPENROUTER_API_KEY || "",
    model: saved.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    temperature: saved.temperature ?? 0.9,
  };
}

// only what owners/customers need to see: enabled methods
export const enabledMethods = (p: Platform) => p.methods.filter((m) => m.enabled);

export const setSetting = (key: string, value: unknown) =>
  db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });

// "sk-or-••••abcd": enough to recognise a key without revealing it
export const maskKey = (key: string) => (key ? `${key.slice(0, 6)}••••${key.slice(-4)}` : "");
