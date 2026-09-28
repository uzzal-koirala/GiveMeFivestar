// Compact headline number used on admin pages; links (optional) to where it can be acted on
import Link from "next/link";
import type { IconType } from "react-icons";
import { FaArrowRight } from "react-icons/fa6";

const TILE = {
  blue: { icon: "bg-blue-50 text-blue-900 ring-blue-100" },
  emerald: { icon: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  rose: { icon: "bg-rose-50 text-rose-600 ring-rose-100" },
  amber: { icon: "bg-amber-50 text-amber-600 ring-amber-100" },
  calm: { icon: "bg-slate-50 text-slate-400 ring-slate-100" },
};

// Compact headline card; links to the page where it can be acted on
export default function Tile({ href, label, value, Icon, color }: { href?: string; label: string; value: string | number; Icon: IconType; color: keyof typeof TILE }) {
  const c = TILE[color];
  const body = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ring-4 sm:size-12 ${c.icon}`}><Icon className="size-4 sm:size-5" /></span>
      <div className="w-full min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase leading-snug tracking-wider text-slate-400 sm:truncate sm:whitespace-nowrap sm:text-xs">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 tabular-nums">{value}</p>
      </div>
      {href && <FaArrowRight className="absolute right-3 top-3 size-3 shrink-0 text-slate-300 sm:static sm:self-start transition group-hover:translate-x-0.5 group-hover:text-slate-600" />}
    </>
  );
  const cls = `group relative flex flex-col items-start gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-5`;
  return href
    ? <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600`}>{body}</Link>
    : <div className={cls}>{body}</div>;
}
