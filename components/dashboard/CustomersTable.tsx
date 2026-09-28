import { FaPhone, FaLocationDot } from "react-icons/fa6";
import type { Customer } from "@/lib/types";
import AdBadge from "@/components/ui/AdBadge";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Stable avatar colour per name
const colors = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-rose-600", "bg-amber-500", "bg-cyan-600"];
export const colorFor = (name: string) => colors[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % colors.length];

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-slate-400">
          <tr>
            {["Customer", "Phone", "Location", "Product", "Date"].map((h) => (
              <th key={h} className="whitespace-nowrap px-6 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((c) => (
            <tr key={c.id} className="transition hover:bg-blue-50/40">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${colorFor(c.name)}`}>
                    {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700">
                  <FaPhone className="size-3 text-slate-400" /> {c.phone}
                </a>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                <span className="inline-flex items-center gap-2"><FaLocationDot className="size-3 text-rose-400" /> {c.location || "—"}</span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{c.product}</span>
                  {c.adId && <AdBadge adId={c.adId} compact />}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-slate-500">{fmt(c.date)}</td>
            </tr>
          ))}
          {!customers.length && (
            <tr><td colSpan={5} className="px-6 py-14 text-center text-slate-500">No customers match these filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
