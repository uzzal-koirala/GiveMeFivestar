// Stat card + trend badge shared by the business and admin dashboards
import type { IconType } from "react-icons";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

export function Delta({ now, before }: { now: number; before: number }) {
  if (!now && !before) return null; // nothing to compare yet
  const pct = before ? Math.round(((now - before) / before) * 100) : 100;
  const up = pct >= 0;
  const Icon = up ? FaArrowTrendUp : FaArrowTrendDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      <Icon className="size-3" /> {up ? "+" : ""}{pct}%
    </span>
  );
}

export function Stat({ label, value, Icon, tint, aside }: { label: string; value: number | string; Icon: IconType; tint: string; aside?: React.ReactNode }) {
  return (
    // phones (two per row): icon on top; from sm up: icon beside the numbers
    <div className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg sm:size-12 ${tint}`}><Icon className="size-4 sm:size-5" /></span>
      <div className="w-full min-w-0 flex-1">
        <p className="text-xs leading-snug text-slate-500 sm:truncate sm:whitespace-nowrap sm:text-sm">{label}</p>
        {/* badge/button sits beside the number so the label keeps the full width */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
          {aside}
        </div>
      </div>
    </div>
  );
}
