// Small shared pieces for the admin pages
import type { IconType } from "react-icons";

export const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export function PageTitle({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-blue-200">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, Icon, tint }: { label: string; value: string | number; Icon: IconType; tint: string }) {
  return (
    <div className={`${card} flex items-center gap-4 p-5`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-lg ${tint}`}><Icon className="size-5" /></span>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

const BADGE: Record<string, string> = {
  submitted: "bg-amber-50 text-amber-700", pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700", running: "bg-blue-50 text-blue-800", completed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};
const BADGE_LABEL: Record<string, string> = { submitted: "Waiting", pending: "Waiting", approved: "Approved", running: "Running", completed: "Completed", rejected: "Rejected" };
export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status] ?? "bg-slate-100 text-slate-600"}`}>{BADGE_LABEL[status] ?? status}</span>
);

export const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
