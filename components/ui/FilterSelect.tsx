"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa6";
import type { IconType } from "react-icons";

type Option = { value: string; label: string };

// Accessible custom dropdown (listbox pattern): click or keyboard (arrows, Enter, Esc)
export default function FilterSelect({ label, Icon, value, options, onChange, fullWidth = false }: {
  label: string;
  Icon: IconType;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];
  const isSet = value !== options[0].value;

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function show() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function pick(o: Option) {
    onChange(o.value);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); return show(); }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, options.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(options[active]); }
  }

  return (
    <div ref={root} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current.label}`}
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${fullWidth ? "w-full" : ""} focus:outline-none focus:ring-4 focus:ring-blue-100 ${
          isSet ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
        } ${open ? "border-blue-600 bg-white ring-4 ring-blue-100" : ""}`}
      >
        <Icon className={`size-3.5 ${isSet ? "text-blue-700" : "text-slate-400"}`} />
        <span className={`whitespace-nowrap ${fullWidth ? "flex-1 text-left" : ""}`}>{current.label}</span>
        <FaChevronDown className={`size-3 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={id}
          role="listbox"
          aria-label={label}
          className={`filter-pop absolute left-0 top-full z-20 mt-2 min-w-56 ${fullWidth ? "max-h-56 w-full" : "max-h-72"} overflow-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-slate-900/10`}
        >
          <li className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</li>
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                className={`flex cursor-pointer items-center justify-between gap-6 rounded-xl px-3 py-2.5 text-sm transition ${
                  i === active ? "bg-blue-50 text-blue-900" : "text-slate-700"
                } ${selected ? "font-semibold" : ""}`}
              >
                {o.label}
                {selected && <span className="grid size-5 place-items-center rounded-full bg-blue-900 text-white"><FaCheck className="size-2.5" /></span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
