"use client";

import { useEffect, useRef } from "react";
import { FaPenNib, FaXmark, FaCheck, FaStore, FaTags, FaHashtag, FaFaceSmile, FaLanguage, FaLightbulb, FaPlus, FaCircleInfo } from "react-icons/fa6";

// One-click lines owners can add to their instructions
const IDEAS = [
  "Keep reviews short and casual, like a real customer wrote them.",
  "Mention our friendly staff and quick service when it fits.",
  "Don't mention prices or discounts.",
  "Write the way locals here really talk.",
  "Never claim things the customer didn't say about their visit.",
];

type Known = { description: string; products: string[]; keywords: string[]; tone: string; language: string };

// Full view + editor for the owner's custom AI instructions, next to what the AI already knows
export default function InstructionsDialog({ open, onClose, value, onChange, max, placeholder, known }: {
  open: boolean; onClose: () => void; value: string; onChange: (v: string) => void; max: number; placeholder: string; known: Known;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); setTimeout(() => area.current?.focus(), 50); }
    if (!open && d.open) d.close();
  }, [open]);

  const add = (line: string) => onChange((value.trim() ? `${value.trimEnd()}\n` : "") + `- ${line}`);
  const facts: { Icon: typeof FaStore; label: string; value: React.ReactNode }[] = [
    { Icon: FaStore, label: "About your business", value: known.description || <span className="text-slate-400">Not added yet</span> },
    { Icon: FaTags, label: "Products & services", value: known.products.length ? known.products.join(", ") : <span className="text-slate-400">None yet</span> },
    { Icon: FaHashtag, label: "Keywords", value: known.keywords.length ? known.keywords.join(", ") : <span className="text-slate-400">None yet</span> },
    { Icon: FaFaceSmile, label: "Tone", value: known.tone },
    { Icon: FaLanguage, label: "Language", value: known.language },
  ];

  return (
    <dialog ref={dialog} onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} aria-label="Custom instructions"
      className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
      <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><FaPenNib /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Custom instructions</h2>
          <p className="text-sm text-slate-500">Everything the AI follows when it writes reviews for your customers.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
        <div>
          <textarea ref={area} value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} rows={12} placeholder={placeholder} aria-label="Custom instructions text"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-500"><FaCircleInfo className="size-3" /> Customers never see these instructions.</span>
            <span className={value.length > max * 0.9 ? "font-semibold text-amber-600" : "text-slate-400"}>{value.length} / {max}</span>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-800"><FaLightbulb className="text-amber-500" /> Ideas to add</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {IDEAS.filter((i) => !value.includes(i)).map((i) => (
              <button key={i} type="button" onClick={() => add(i)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800">
                <FaPlus className="size-2.5 shrink-0" /> {i}
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">What the AI already knows</p>
          <ul className="mt-4 space-y-4">
            {facts.map(({ Icon, label, value: v }) => (
              <li key={label} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-800 shadow-sm ring-1 ring-slate-100"><Icon className="size-3.5" /></span>
                <span className="min-w-0 text-sm">
                  <span className="block text-xs font-semibold text-slate-500">{label}</span>
                  <span className="line-clamp-4 break-words text-slate-800">{v}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">Change these in the Business tab and above on this page.</p>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <p className="text-xs text-slate-500">Changes are saved with the <b>Save changes</b> bar.</p>
        <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
          <FaCheck className="size-3" /> Done
        </button>
      </div>
    </dialog>
  );
}
