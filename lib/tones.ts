import { FaFaceSmile, FaBriefcase, FaFire } from "react-icons/fa6";
import type { IconType } from "react-icons";

// How AI-written reviews should sound. `sample` uses {p} for a product name.
export const TONES: { id: string; label: string; desc: string; Icon: IconType; sample: string }[] = [
  { id: "friendly", label: "Friendly", desc: "Warm and personal", Icon: FaFaceSmile, sample: "Such a lovely spot! The {p} was delicious and the staff made us feel right at home. Will be back soon." },
  { id: "professional", label: "Professional", desc: "Polished and clear", Icon: FaBriefcase, sample: "Excellent service and consistently high-quality {p}. Clean, well-run and fairly priced. Highly recommended." },
  { id: "enthusiastic", label: "Enthusiastic", desc: "Excited and energetic", Icon: FaFire, sample: "Absolutely loved it! Best {p} I've had in ages, every bite was amazing. Can't wait to come back!" },
];
