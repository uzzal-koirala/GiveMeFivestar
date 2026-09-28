"use client";

import { useState } from "react";
import { monotonePath } from "@/lib/chart";

type Point = { label: string; count: number };

// Single-series line chart: 2px line, soft area, crosshair + tooltip on hover/focus, screen-reader table
export default function ReviewsChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.count));
  const top = Math.ceil(max / 2) * 2; // even number so the midline is whole
  const ticks = [top, top / 2, 0];

  // coordinates in a 0–100 box; SVG stretches to the plot size
  const xs = data.map((_, i) => (i / (data.length - 1)) * 100);
  const ys = data.map((d) => 100 - (d.count / top) * 100);
  const line = monotonePath(xs, ys);
  const h = hover !== null ? { x: xs[hover], y: ys[hover], d: data[hover] } : null;

  return (
    <figure className="flex h-full flex-col">
      <div className="flex min-h-56 flex-1 gap-3">
        {/* y axis */}
        <div className="flex flex-col justify-between pb-7 text-right text-[11px] tabular-nums text-slate-400">
          {ticks.map((t) => <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-1/2">{t}</span>)}
        </div>

        <div className="relative flex-1">
          {/* plot area (leaves 28px at the bottom for x labels) */}
          <div className="absolute inset-x-0 top-0 bottom-7">
            {/* grid */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {ticks.map((t) => <span key={t} className={`border-t ${t === 0 ? "border-slate-300" : "border-dashed border-slate-100"}`} />)}
            </div>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              <path d={`${line} L100,100 L0,100 Z`} fill="#2563eb" fillOpacity="0.08" />
              <path d={line} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* crosshair, dot and tooltip */}
            {h && (
              <>
                <span className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-slate-300" style={{ left: `${h.x}%` }} />
                <span className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-700 shadow ring-4 ring-blue-600/15"
                  style={{ left: `${h.x}%`, top: `${h.y}%` }} />
                <span className={`pointer-events-none absolute z-10 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg ${h.x > 80 ? "-translate-x-full" : h.x < 20 ? "" : "-translate-x-1/2"}`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                  <b className="font-semibold">{h.d.count}</b> <span className="text-slate-300">review{h.d.count === 1 ? "" : "s"} · {h.d.label}</span>
                </span>
              </>
            )}
          </div>

          {/* hit targets: one column per day, wider than the line */}
          <div className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${d.label}: ${d.count} reviews`}
                // first/last columns are half-width so each column centres on its point
                className={`relative h-full outline-none focus-visible:bg-blue-50/50 ${i === 0 || i === data.length - 1 ? "flex-[0.5]" : "flex-1"}`}
              >
                <span className={`absolute bottom-0 text-[11px] ${i === 0 ? "left-0" : i === data.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"} ${hover === i ? "font-semibold text-slate-700" : "text-slate-400"} ${i % 2 ? "hidden sm:block" : ""}`}>
                  {d.label.split(" ")[1]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Reviews per day</caption>
        <tbody>{data.map((d) => <tr key={d.label}><th>{d.label}</th><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
