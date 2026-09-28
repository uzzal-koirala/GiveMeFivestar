"use client";

import { useState } from "react";
import { FaMagnifyingGlass, FaLocationDot, FaBoxOpen, FaXmark, FaCalendarDays, FaShareNodes } from "react-icons/fa6";
import FilterSelect from "@/components/ui/FilterSelect";
import type { Customer } from "@/lib/types";

// array, not object: JS would reorder numeric keys ahead of "all"
const PERIODS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const SOURCES = [
  { value: "", label: "All sources" },
  { value: "qr", label: "QR code / link" },
  { value: "ad", label: "Ads" },
];

const searchCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

// Shared search + product/location/date filters for Customers and Reviews
export function useFilters(items: Customer[], searchIn: (keyof Customer)[], placeholder: string) {
  const [q, setQ] = useState("");
  const [product, setProduct] = useState("");
  const [loc, setLoc] = useState("");
  const [period, setPeriod] = useState("all");
  const [source, setSource] = useState("");

  const products = [...new Set(items.map((c) => c.product))].sort();
  const locations = [...new Set(items.map((c) => c.location).filter(Boolean))].sort();

  const rows = items
    .filter((c) =>
      (!q || searchIn.some((k) => String(c[k] ?? "").toLowerCase().includes(q.toLowerCase()))) &&
      (!product || c.product === product) &&
      (!loc || c.location === loc) &&
      (period === "all" || Date.now() - Date.parse(c.date) < +period * 864e5) &&
      (!source || (source === "ad") === !!c.adId)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const active = q || product || loc || source || period !== "all";

  const bar = (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-60 flex-1">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search" className={searchCls} />
      </label>
      <FilterSelect
        label="Product" Icon={FaBoxOpen} value={product} onChange={setProduct}
        options={[{ value: "", label: "All products" }, ...products.map((p) => ({ value: p, label: p }))]}
      />
      <FilterSelect
        label="Location" Icon={FaLocationDot} value={loc} onChange={setLoc}
        options={[{ value: "", label: "All locations" }, ...locations.map((l) => ({ value: l, label: l }))]}
      />
      <FilterSelect
        label="Date" Icon={FaCalendarDays} value={period} onChange={setPeriod}
        options={PERIODS}
      />
      <FilterSelect label="Source" Icon={FaShareNodes} value={source} onChange={setSource} options={SOURCES} />
      {active && (
        <button onClick={() => { setQ(""); setProduct(""); setLoc(""); setPeriod("all"); setSource(""); }} className="flex items-center gap-1 px-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          <FaXmark /> Clear
        </button>
      )}
    </div>
  );

  return { rows, bar, locations, products };
}
