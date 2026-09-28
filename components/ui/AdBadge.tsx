import { FaBullhorn } from "react-icons/fa6";

// Marks a review/customer that came from an ad campaign
export default function AdBadge({ adId, compact = false }: { adId: string; compact?: boolean }) {
  return (
    <span title={`This review came from ad ${adId}`} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200/60">
      <FaBullhorn className="size-2.5" /> {compact ? "Ad" : `From ad · ${adId}`}
    </span>
  );
}
