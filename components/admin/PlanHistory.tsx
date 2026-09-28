// Timeline of a business's plan: upgrades, purchases, extensions, expiry and sign-up
import type { IconType } from "react-icons";
import { FaClockRotateLeft, FaArrowUp, FaArrowDown, FaRotateRight, FaCartShopping, FaUserPlus, FaHourglassEnd, FaCircleMinus, FaStore } from "react-icons/fa6";
import { plans } from "@/lib/site";
import { npr } from "@/components/ui/PaymentMethods";
import { fmtDate } from "./ui";

export type PlanChangeRow = {
  id: string; fromPlan: string; toPlan: string; months: number; expiresAt: string | null;
  source: string; byName: string; amount: number; method: string; createdAt: string;
};

const RANK: Record<string, number> = { free: 0, pro: 1, business: 2 };
const name = (id: string) => plans.find((p) => p.id === id)?.name ?? id;
const duration = (m: number) => (m % 12 === 0 ? `${m / 12} year${m > 12 ? "s" : ""}` : `${m} month${m > 1 ? "s" : ""}`);
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : m < 43200 ? `${Math.round(m / 1440)}d ago` : fmtDate(iso);
};

type Entry = { key: string; at: string; Icon: IconType; tint: string; title: React.ReactNode; detail: string; tag?: { label: string; cls: string } };

const TAGS = {
  admin: { label: "By admin", cls: "bg-blue-50 text-blue-800 ring-blue-100" },
  purchase: { label: "Purchase", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  created: { label: "New account", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};

function toEntry(c: PlanChangeRow): Entry {
  const up = RANK[c.toPlan] > RANK[c.fromPlan], down = RANK[c.toPlan] < RANK[c.fromPlan];
  const arrow = <><b>{name(c.fromPlan)}</b> → <b>{name(c.toPlan)}</b></>;
  const [Icon, tint, title]: [IconType, string, React.ReactNode] =
    c.source === "created" ? [FaStore, "bg-slate-100 text-slate-600", <>Account created on <b>{name(c.toPlan)}</b></>]
    : c.toPlan === "free" ? [FaCircleMinus, "bg-slate-100 text-slate-600", <>Moved to <b>Free</b> from <b>{name(c.fromPlan)}</b></>]
    : up ? [c.source === "purchase" ? FaCartShopping : FaArrowUp, "bg-emerald-100 text-emerald-700", <>Upgraded {arrow}</>]
    : down ? [FaArrowDown, "bg-amber-100 text-amber-700", <>Downgraded {arrow}</>]
    : [c.source === "purchase" ? FaCartShopping : FaRotateRight, "bg-blue-100 text-blue-800", <>{c.source === "purchase" ? "Renewed" : "Extended"} <b>{name(c.toPlan)}</b></>];

  const until = c.expiresAt ? ` · until ${fmtDate(c.expiresAt)}` : "";
  const detail =
    c.source === "purchase" ? `Owner bought ${duration(c.months)} · ${npr(c.amount)}${c.method ? ` via ${c.method}` : ""}${until} · approved by ${c.byName || "admin"}`
    : c.source === "created" ? `${duration(c.months)}${until} · set by ${c.byName || "admin"}`
    : c.toPlan === "free" ? `By ${c.byName || "admin"} · no end date`
    : `By ${c.byName || "admin"} · ${duration(c.months)}${until}`;
  return { key: c.id, at: c.createdAt, Icon, tint, title, detail, tag: TAGS[c.source as keyof typeof TAGS] };
}

export default function PlanHistory({ changes, joined, plan, planExpiresAt }: { changes: PlanChangeRow[]; joined: string; plan: string; planExpiresAt: string | null }) {
  const entries: Entry[] = changes.map(toEntry);
  // an expiry isn't an action anyone took, so it's worked out from the current plan
  if (plan !== "free" && planExpiresAt && Date.parse(planExpiresAt) < Date.now()) {
    entries.push({ key: "expired", at: planExpiresAt, Icon: FaHourglassEnd, tint: "bg-rose-100 text-rose-700", title: <><b>{name(plan)}</b> expired</>, detail: "Back on Free until renewed" });
  }
  if (!changes.some((c) => c.source === "created")) {
    entries.push({ key: "joined", at: joined, Icon: FaUserPlus, tint: "bg-slate-100 text-slate-600", title: <>Joined on <b>Free</b></>, detail: "Signed up" });
  }
  entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-slate-900"><FaClockRotateLeft className="size-3.5 text-blue-700" /> Plan history</h3>
        <span className="text-xs text-slate-500">{changes.length} change{changes.length === 1 ? "" : "s"}</span>
      </div>
      <ol className="relative mt-4 space-y-5 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-slate-200">
        {entries.map((e) => (
          <li key={e.key} className="relative flex gap-4">
            <span className={`relative grid size-9 shrink-0 place-items-center rounded-full ring-4 ring-white ${e.tint}`}><e.Icon className="size-3.5" /></span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm text-slate-800">{e.title}</p>
                {e.tag && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${e.tag.cls}`}>{e.tag.label}</span>}
                <span className="ml-auto text-xs text-slate-400" title={fmtDate(e.at)}>{ago(e.at)}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{e.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
