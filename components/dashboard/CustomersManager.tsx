"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FaFileImport, FaFileExport, FaUsers, FaLocationDot, FaBoxOpen, FaXmark, FaBullhorn, FaLock, FaArrowRight } from "react-icons/fa6";
import CustomersTable from "./CustomersTable";
import { useFilters } from "./useFilters";
import { parseCSV, toCSV } from "@/lib/csv";
import type { Customer } from "@/lib/types";
import { importCustomers } from "@/app/actions/customers";

const COLUMNS = ["name", "phone", "location", "product", "date"] as const;

export default function CustomersManager({ initial, limit, hiddenOnServer = 0, planName = "Free", nextPlan = "Pro" }: { initial: Customer[]; limit: number | null; hiddenOnServer?: number; planName?: string; nextPlan?: string }) {
  const [all, setCustomers] = useState(initial);
  // plan limit: only the newest few are shown; the rest stay saved for when they upgrade
  const customers = limit === null ? all : [...all].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, limit);
  const hidden = hiddenOnServer + all.length - customers.length; // held back by the server + pushed out by new imports
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { rows, bar, locations, products } = useFilters(customers, ["name", "phone"], "Search name or phone");

  const [importing, setImporting] = useState(false);

  // parse the CSV in the browser, save it on the server
  async function importFile(file: File) {
    const [header, ...data] = parseCSV(await file.text());
    const idx = Object.fromEntries(COLUMNS.map((c) => [c, header?.findIndex((h) => h.trim().toLowerCase() === c) ?? -1]));
    const missing = ["name", "phone", "product"].filter((c) => idx[c] < 0);
    if (missing.length) return setNotice({ ok: false, text: `Missing column(s): ${missing.join(", ")}. Expected: ${COLUMNS.join(", ")}.` });

    const get = (r: string[], c: string) => (idx[c] >= 0 ? r[idx[c]]?.trim() ?? "" : "");
    const rows = data
      .filter((r) => get(r, "name") && get(r, "phone"))
      .map((r) => {
        const d = Date.parse(get(r, "date"));
        return { name: get(r, "name"), phone: get(r, "phone"), location: get(r, "location"), product: get(r, "product"), date: new Date(isNaN(d) ? Date.now() : d).toISOString() };
      });
    if (!rows.length) return setNotice({ ok: false, text: "No customers found. Each row needs at least a name and phone." });

    setImporting(true);
    const res = await importCustomers(rows);
    setImporting(false);
    if (res.error || !res.imported) return setNotice({ ok: false, text: res.error ?? "Import failed. Please try again." });
    setCustomers((prev) => [...res.imported!, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setNotice({ ok: true, text: `Imported ${res.imported.length} customer${res.imported.length === 1 ? "" : "s"}.` });
  }

  function exportCSV() {
    const csv = toCSV([[...COLUMNS], ...rows.map((c) => [c.name, c.phone, c.location, c.product, c.date.slice(0, 10)])]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const stats = [
    { label: "Total customers", value: customers.length, Icon: FaUsers },
    { label: "Locations", value: locations.length, Icon: FaLocationDot },
    { label: "Products bought", value: products.length, Icon: FaBoxOpen },
    { label: "From ads", value: customers.filter((c) => c.adId).length, Icon: FaBullhorn },
  ];

  return (
    <div className="space-y-6">
      {/* Title + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="mt-1 text-blue-200">Everyone who scanned your link and left their details.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-blue-950 hover:bg-amber-200 disabled:opacity-70">
            <FaFileImport /> {importing ? "Importing…" : "Import CSV"}
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">
            <FaFileExport /> Export
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><FaXmark /></button>
        </div>
      )}

      {hidden > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700"><FaLock className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-950">{hidden.toLocaleString()} more customer{hidden === 1 ? " is" : "s are"} saved but hidden</p>
            <p className="text-sm text-amber-800">The {planName} plan shows your newest {limit} customers. Upgrade to {nextPlan} to see and export everyone.</p>
          </div>
          <Link href="/dashboard/settings?tab=subscription" className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 sm:w-auto">
            Upgrade <FaArrowRight className="size-3" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800 sm:size-12"><Icon className="size-4 sm:size-5" /></span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          {bar}
        </div>

        <CustomersTable customers={rows} />

        <p className="border-t border-slate-100 px-6 py-3 text-sm text-slate-500">
          Showing <b className="text-slate-800">{rows.length}</b> of {customers.length} customers
        </p>
      </div>
    </div>
  );
}
