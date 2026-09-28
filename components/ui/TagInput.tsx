"use client";

import { useState } from "react";
import { FaXmark, FaPlus } from "react-icons/fa6";

// Type and press Enter (or comma) to add; Backspace on empty input removes the last tag
export default function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState("");

  function add() {
    const t = text.trim().replace(/,$/, "");
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
      {value.map((t) => (
        <span key={t} className="tag-pop flex items-center gap-1.5 rounded-lg bg-blue-900 py-1 pl-3 pr-1.5 text-sm font-medium text-white">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Remove ${t}`} className="grid size-5 place-items-center rounded-md hover:bg-white/20">
            <FaXmark className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "Add another…" : placeholder}
        aria-label="Add product"
        className="min-w-32 flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-400"
      />
      {text.trim() && (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={add} className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-sm">
          <FaPlus className="size-2.5" /> Add
        </button>
      )}
    </div>
  );
}
