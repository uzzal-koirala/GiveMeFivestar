"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaNoteSticky, FaPen, FaTrashCan, FaPlus, FaLock, FaCircleExclamation } from "react-icons/fa6";
import { saveAdminNote } from "@/app/actions/admin";

// Private sticky note about a business, only super admins see it
export default function AdminNote({ userId, note }: { userId: string; note: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState(note);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const save = (value: string) =>
    start(async () => {
      const res = await saveAdminNote(userId, value);
      if (res.error) return setError(res.error);
      setEditing(false); setConfirming(false); setError(""); router.refresh();
    });

  const iconBtn = "grid size-8 place-items-center rounded-lg text-amber-700/70 transition hover:bg-amber-100 hover:text-amber-900";

  if (!note && !editing)
    return (
      <button type="button" onClick={() => { setText(""); setEditing(true); }}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white px-5 py-4 text-left text-sm text-slate-500 transition hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800">
        <span className="grid size-9 place-items-center rounded-lg bg-amber-100 text-amber-700"><FaPlus className="size-3" /></span>
        <span><b className="font-semibold text-slate-800">Add an admin note</b><br />Private notes about this business. Only super admins see them.</span>
      </button>
    );

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700"><FaNoteSticky className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-amber-950">Admin note</h2>
          <p className="flex items-center gap-1.5 text-xs text-amber-800/70"><FaLock className="size-2.5" /> Only super admins can see this</p>
        </div>
        {!editing && !confirming && (
          <div className="flex gap-1">
            <button type="button" onClick={() => { setText(note); setEditing(true); }} aria-label="Edit admin note" title="Edit note" className={iconBtn}><FaPen className="size-3" /></button>
            <button type="button" onClick={() => setConfirming(true)} aria-label="Delete admin note" title="Delete note" className={`${iconBtn} hover:bg-rose-100 hover:text-rose-700`}><FaTrashCan className="size-3" /></button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} autoFocus aria-label="Admin note"
            placeholder="e.g. Paid by cash at the office. Wants a call before renewal."
            className="mt-4 w-full resize-y rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {error && <p role="alert" className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
            <span className="mr-auto text-xs text-amber-800/60">{text.length}/2000</span>
            <button type="button" onClick={() => { setEditing(false); setError(""); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-900/70 hover:bg-amber-100">Cancel</button>
            <button type="button" disabled={pending || !text.trim() || text.trim() === note} onClick={() => save(text)}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
              {pending ? "Saving…" : "Save note"}
            </button>
          </div>
        </>
      ) : (
        <p className="mt-4 whitespace-pre-wrap border-l-4 border-amber-300 pl-4 text-sm leading-relaxed text-amber-950">{note}</p>
      )}

      {confirming && (
        <div role="alertdialog" aria-label="Delete admin note" className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-white px-4 py-3 ring-1 ring-rose-200">
          <p className="mr-auto text-sm font-medium text-rose-700">Delete this note? This can’t be undone.</p>
          <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Keep</button>
          <button type="button" disabled={pending} onClick={() => save("")}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50">
            <FaTrashCan className="size-3" /> {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </section>
  );
}
