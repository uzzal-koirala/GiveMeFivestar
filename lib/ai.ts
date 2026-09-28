// Writes 3 review drafts for a customer. Uses OpenRouter when configured, otherwise built-in templates.
import "server-only";
import { getAiConfig, type AiConfig } from "@/lib/platform";

export type ReviewInput = {
  businessName: string;
  description: string;
  product: string;
  rating: number; // 1-5
  tone: string; // friendly | professional | enthusiastic
  language?: string; // en | ne | mix
  instructions?: string; // owner's extra guidance
  keywords?: string[]; // words the owner wants to appear (SEO), used only where they fit
};

const LANGUAGE: Record<string, string> = {
  en: "English",
  ne: "Nepali (Devanagari script)",
  mix: "a natural mix of Nepali and English written in Roman letters",
};

const OPTIONS = 3;

export async function generateReviews(input: ReviewInput): Promise<string[]> {
  const ai = await getAiConfig();
  if (ai.enabled && ai.apiKey && ai.model) {
    try {
      const reviews = await fromOpenRouter(input, ai);
      if (reviews.length) return reviews;
    } catch (e) {
      console.error("OpenRouter failed, using templates:", e);
    }
  }
  return fromTemplates(input);
}

async function fromOpenRouter({ businessName, description, product, rating, tone, language = "en", instructions, keywords = [] }: ReviewInput, ai: AiConfig): Promise<string[]> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${ai.apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model: ai.model,
      temperature: ai.temperature,
      messages: [
        {
          role: "system",
          content:
            "You help real customers put their own experience into words for a Google review. " +
            "Write in first person as the customer. The review must honestly match the star rating: " +
            "5 = delighted, 4 = happy with a small note, 3 = mixed, 2 = disappointed, 1 = very unhappy. " +
            "Only mention the product given; do not invent staff names, prices or facts not in the business description. " +
            `Each review is 1-3 short sentences, natural, no hashtags or emojis. Write in ${LANGUAGE[language] ?? "English"}. ` +
            "Follow the business's guidance when it fits, but never contradict the star rating. " +
            "If keywords are given, each review may include AT MOST ONE of them, a different one per review, " +
            "and only where it reads naturally; it is fine for a review to use none. Never list keywords or force one that doesn't fit. " +
            `Reply with only a JSON array of ${OPTIONS} different strings.`,
        },
        {
          role: "user",
          content:
            `Business: ${businessName}\nAbout the business: ${description || "n/a"}\nWhat the customer bought/used: ${product}\n` +
            `Star rating: ${rating}/5\nTone: ${tone}` + (instructions ? `\nBusiness guidance: ${instructions}` : "") +
            (keywords.length ? `\nKeywords (max one per review): ${pickKeywords(keywords).join(", ")}` : ""),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1); // tolerate prose/code fences around the array
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return [];
  // models sometimes wrap each review as {"review": "..."}
  return parsed
    .map((r) => (typeof r === "string" ? r : typeof r === "object" && r ? String((r as Record<string, unknown>).review ?? (r as Record<string, unknown>).text ?? "") : ""))
    .map((r) => r.trim()).filter(Boolean).slice(0, OPTIONS);
}

// a fresh shuffle each time, one keyword per review option, so reviews don't all repeat the same words
function pickKeywords(keywords: string[]) {
  const pool = [...keywords];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, OPTIONS);
}

// Offline fallback: honest, rating-matched drafts
const TEMPLATES: Record<"great" | "good" | "mixed" | "poor" | "bad", string[]> = {
  great: [
    "Had a wonderful experience at {b}. The {p} was excellent and everything felt well taken care of. Highly recommend!",
    "Really impressed with the {p} at {b}. Great quality and a welcoming experience from start to finish.",
    "{b} did a fantastic job. Loved the {p} and will definitely be coming back.",
  ],
  good: [
    "Good experience at {b}. The {p} was very nice, just a little room to improve. Would visit again.",
    "Enjoyed the {p} at {b}. Solid quality and friendly service overall.",
    "Nice visit to {b}. The {p} was good and I left happy.",
  ],
  mixed: [
    "The {p} at {b} was okay. Some things were good, others could be better.",
    "Average experience at {b}. The {p} was fine but nothing special this time.",
    "Mixed feelings about {b}. The {p} was decent, though I expected a bit more.",
  ],
  poor: [
    "I was a bit disappointed with the {p} at {b}. It didn't quite meet my expectations.",
    "Not the best experience at {b}. The {p} needs some improvement.",
    "The {p} at {b} was below what I hoped for. I hope they improve.",
  ],
  bad: [
    "Unfortunately my experience at {b} was not good. The {p} did not meet my expectations.",
    "Very unhappy with the {p} at {b}. I expected much better.",
    "I had a poor experience with the {p} at {b} and would not recommend it right now.",
  ],
};
const BUCKET = ["bad", "bad", "poor", "mixed", "good", "great"] as const; // index = stars

const TONE_ENDINGS: Record<string, Record<"positive" | "neutral", string>> = {
  friendly: { positive: " Thanks, team!", neutral: "" },
  professional: { positive: "", neutral: "" },
  enthusiastic: { positive: " Can't wait to come back!", neutral: "" },
};

function fromTemplates({ businessName, product, rating, tone }: ReviewInput): string[] {
  const stars = Math.min(5, Math.max(1, Math.round(rating)));
  const ending = TONE_ENDINGS[tone]?.[stars >= 4 ? "positive" : "neutral"] ?? "";
  return TEMPLATES[BUCKET[stars]].map((t, i) =>
    t.replaceAll("{b}", businessName).replaceAll("{p}", product.toLowerCase()) + (i === 0 ? ending : "")
  );
}
