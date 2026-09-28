"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FilterSelect from "@/components/ui/FilterSelect";
import { FaMagnifyingGlass, FaChevronRight, FaBan, FaTableCellsLarge, FaList, FaEnvelope, FaPhone, FaLocationDot, FaCrown, FaArrowRight, FaLayerGroup, FaCircleHalfStroke, FaCalendar, FaArrowDownWideShort, FaXmark, FaHourglassHalf } from "react-icons/fa6";
import { plans } from "@/lib/site";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { card, fmtDate } from "./ui";

type Row = {
  id: string; name: string; email: string; phone: string; businessName: string; plan: string; credits: number;
  joined: string; responses: number; suspended: boolean; logoUrl: string | null; location: string; setup: boolean;
};

const PLAN_OPTIONS = [{ value: "all", label: "All plans" }, { value: "paid", label: "Paid plans" }, ...plans.map((p) => ({ value: p.id, label: p.name }))];
const STATUS_OPTIONS = [{ value: "all", label: "Any status" }, { value: "active", label: "Active" }, { value: "setup", label: "Setup pending" }, { value: "suspended", label: "Suspended" }];
const JOINED_OPTIONS = [{ value: "all", label: "Any time" }, { value: "week", label: "Last 7 days" }, { value: "month", label: "This month" }, { value: "year", label: "This year" }];
const SORT_OPTIONS = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "responses", label: "Most responses" }, { value: "credits", label: "Fewest credits" }, { value: "name", label: "Name A–Z" }];
const pick = (v: string | null, opts: { value: string }[]) => (v && opts.some((o) => o.value === v) ? v : opts[0].value);

const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
  business: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PLAN_BADGE[plan] ?? PLAN_BADGE.free}`}>
      {plan !== "free" && <FaCrown className="size-2.5" />} {plans.find((p) => p.id === plan)?.name ?? plan}
    </span>
  );
}

function Logo({ b, size }: { b: Row; size: string }) {
  return b.logoUrl
    ? <img src={b.logoUrl} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />
    : <span className={`grid ${size} shrink-0 place-items-center rounded-lg text-sm font-bold text-white ${colorFor(b.businessName)}`}>{initials(b.businessName)}</span>;
}

// Box view: one card per business
function BusinessCard({ b }: { b: Row }) {
  return (
    <Link href={`/admin/businesses/${b.id}`}
      className={`group flex flex-col rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${b.suspended ? "border-rose-200" : "border-slate-200"}`}>
      <div className="flex items-start gap-3.5">
        <Logo b={b} size="size-14" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900 group-hover:text-blue-800">{b.businessName}</p>
          <p className="truncate text-sm text-slate-500">{b.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <PlanBadge plan={b.plan} />
            {b.suspended && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700"><FaBan className="size-2.5" /> Suspended</span>}
            {!b.setup && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600"><FaHourglassHalf className="size-2.5" /> Setup pending</span>}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
        <li className="flex items-center gap-2"><FaEnvelope className="size-3 shrink-0 text-slate-400" /> <span className="truncate">{b.email}</span></li>
        <li className="flex items-center gap-2"><FaPhone className="size-3 shrink-0 text-slate-400" /> {b.phone || <span className="text-slate-400">No phone</span>}</li>
        <li className="flex items-center gap-2"><FaLocationDot className="size-3 shrink-0 text-slate-400" /> <span className="truncate">{b.location || <span className="text-slate-400">No location</span>}</span></li>
      </ul>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-md bg-slate-50 py-2.5 text-center">
        <div><dt className="text-[11px] text-slate-500">Responses</dt><dd className="font-bold tabular-nums text-slate-900">{b.responses}</dd></div>
        <div><dt className="text-[11px] text-slate-500">Credits</dt><dd className={`font-bold tabular-nums ${b.credits < 25 ? "text-rose-600" : "text-slate-900"}`}>{b.credits}</dd></div>
        <div><dt className="text-[11px] text-slate-500">Joined</dt><dd className="text-xs font-bold leading-6 text-slate-900">{fmtDate(b.joined)}</dd></div>
      </dl>

      <span className="mt-4 flex items-center justify-end gap-1.5 text-sm font-semibold text-blue-700">
        View profile <FaArrowRight className="size-3 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

// Every business; click one to open its profile
export default function BusinessesTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  // remember the chosen view in this browser
  useEffect(() => { try { if (localStorage.getItem("admin-businesses-view") === "list") setView("list"); } catch {} }, []);
  const choose = (v: "grid" | "list") => { setView(v); try { localStorage.setItem("admin-businesses-view", v); } catch {} };
  const params = useSearchParams();
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [joined, setJoined] = useState("all");
  const [sort, setSort] = useState("newest");
  // the boxes above link here with ?plan=paid etc.
  useEffect(() => {
    setPlan(pick(params.get("plan"), PLAN_OPTIONS));
    setStatus(pick(params.get("status"), STATUS_OPTIONS));
    setJoined(pick(params.get("joined"), JOINED_OPTIONS));
  }, [params]);

  const now = new Date();
  const since = joined === "week" ? Date.now() - 7 * 864e5 : joined === "month" ? new Date(now.getFullYear(), now.getMonth(), 1).getTime() : joined === "year" ? new Date(now.getFullYear(), 0, 1).getTime() : 0;
  const filtered = rows.filter((r) =>
    (!q || `${r.businessName} ${r.name} ${r.email} ${r.phone} ${r.location}`.toLowerCase().includes(q.toLowerCase())) &&
    (plan === "all" || (plan === "paid" ? r.plan !== "free" : r.plan === plan)) &&
    (status === "all" || (status === "suspended" ? r.suspended : status === "setup" ? !r.setup : !r.suspended && r.setup)) &&
    Date.parse(r.joined) >= since
  );
  const shown = [...filtered].sort((a, b) =>
    sort === "oldest" ? Date.parse(a.joined) - Date.parse(b.joined)
    : sort === "responses" ? b.responses - a.responses
    : sort === "credits" ? a.credits - b.credits
    : sort === "name" ? a.businessName.localeCompare(b.businessName)
    : Date.parse(b.joined) - Date.parse(a.joined));
  const anyFilter = q || plan !== "all" || status !== "all" || joined !== "all";
  const clear = () => { setQ(""); setPlan("all"); setStatus("all"); setJoined("all"); history.replaceState(null, "", location.pathname); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <label className="relative block min-w-0 flex-1 sm:max-w-md">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business, owner, email or phone" aria-label="Search businesses"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </label>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Plan" Icon={FaLayerGroup} value={plan} options={PLAN_OPTIONS} onChange={setPlan} />
          <FilterSelect label="Status" Icon={FaCircleHalfStroke} value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <FilterSelect label="Joined" Icon={FaCalendar} value={joined} options={JOINED_OPTIONS} onChange={setJoined} />
          <FilterSelect label="Sort" Icon={FaArrowDownWideShort} value={sort} options={SORT_OPTIONS} onChange={setSort} />
        </div>
        <div role="radiogroup" aria-label="View" className="ml-auto flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {([["grid", FaTableCellsLarge, "Box"], ["list", FaList, "List"]] as const).map(([v, Icon, label]) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => choose(v)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === v ? "bg-blue-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <Icon className="size-3.5" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-1 text-sm text-slate-500">
        <span><b className="text-slate-900">{shown.length}</b> of {rows.length} businesses</span>
        {anyFilter && (
          <button type="button" onClick={clear} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-slate-200 hover:ring-blue-300">
            <FaXmark className="size-2.5" /> Clear filters
          </button>
        )}
      </div>

      {!shown.length ? (
        <p className={`${card} px-6 py-14 text-center text-sm text-slate-500`}>No businesses match these filters.</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b) => <BusinessCard key={b.id} b={b} />)}
        </div>
      ) : (
      <ul className={`${card} divide-y divide-slate-100`}>
        {shown.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/businesses/${b.id}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[auto_2fr_1fr_1fr_1fr_auto]">
              <Logo b={b} size="size-10" />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold text-slate-900">{b.businessName}</span>
                  {b.suspended && <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700"><FaBan className="size-2.5" /> Suspended</span>}
                </span>
                <span className="block truncate text-xs text-slate-500">{b.name} · {b.email}</span>
              </span>
              <span className="hidden text-sm md:block"><PlanBadge plan={b.plan} /></span>
              <span className="hidden text-sm text-slate-600 md:block"><b className="text-slate-900">{b.credits}</b> credits</span>
              <span className="hidden text-sm text-slate-600 md:block"><b className="text-slate-900">{b.responses}</b> responses · {fmtDate(b.joined)}</span>
              <FaChevronRight className="size-3 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
