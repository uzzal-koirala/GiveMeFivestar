import Link from "next/link";
import { FaGoogle, FaCircleCheck, FaLock, FaArrowUpRightFromSquare, FaTicket, FaLocationDot } from "react-icons/fa6";

// The business's single Google review link. Locked once set; changes go through the super admin.
export default function GoogleLinkCard({ businessName, location, url, linkedOn }: { businessName: string; location?: string; url: string; linkedOn: string | Date }) {
  const since = new Date(linkedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaGoogle className="text-blue-700" /> Google Business</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <FaCircleCheck className="size-3" /> Connected
        </span>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">{businessName}</p>
        {location && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500"><FaLocationDot className="size-3" /> {location}</p>}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-1.5">
          <FaLock className="size-3 shrink-0 text-slate-400" aria-label="Locked" />
          <p className="min-w-0 flex-1 truncate text-sm text-slate-600">{url.replace(/^https?:\/\//, "")}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open Google review page" title="Open" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <FaArrowUpRightFromSquare className="size-3" />
          </a>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-500">
        Connected on {since}. Your review link is locked so customers are always sent to the right place.
      </p>

      <Link href="/dashboard/support?new=google-link"
        className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        <FaTicket className="text-blue-700" /> Request a change
      </Link>
    </section>
  );
}
