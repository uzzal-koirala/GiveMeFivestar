import { customAlphabet } from "nanoid";

export const createSlug = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

// "Himalayan Café" -> "himalayan-cafe-k3m9"
export const slugFor = (name: string) =>
  `${name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "business"}-${createSlug().slice(0, 4)}`;

// "How to get 5-star reviews!" -> "how-to-get-5-star-reviews" (readable URLs for blog posts and jobs)
export const slugify = (text: string) =>
  text.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "post";
