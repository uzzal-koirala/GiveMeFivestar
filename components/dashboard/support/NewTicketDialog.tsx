"use client";

import { forwardRef, useState } from "react";
import { FaXmark, FaPaperPlane, FaTags, FaClock } from "react-icons/fa6";
import FileDrop from "@/components/ui/FileDrop";
import FilterSelect from "@/components/ui/FilterSelect";
import type { TicketPriority } from "@/lib/types";
import { TICKET_CATEGORIES } from "@/lib/site";
import { site } from "@/lib/site";
import { PRIORITY } from "./ticketStyles";

export type NewTicket = { subject: string; category: string; priority: TicketPriority; body: string; attachment?: File };
export type TicketDraft = Partial<Pick<NewTicket, "subject" | "category" | "body">>;

const field =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

// Re-mounted (via key) each time it opens so a draft can pre-fill it
const NewTicketDialog = forwardRef<HTMLDialogElement, { draft: TicketDraft; onSubmit: (t: NewTicket) => void }>(function NewTicketDialog({ draft, onSubmit }, ref) {
  const [subject, setSubject] = useState(draft.subject ?? "");
  const [category, setCategory] = useState(draft.category ?? TICKET_CATEGORIES[0]);
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [body, setBody] = useState(draft.body ?? "");
  const [file, setFile] = useState<File | null>(null);
  const close = () => (ref as React.RefObject<HTMLDialogElement>).current?.close();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ subject: subject.trim(), category, priority, body: body.trim(), ...(file && { attachment: file }) });
    close();
  }

  return (
    <dialog ref={ref} onClick={(e) => e.target === e.currentTarget && close()}
      className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
      <form onSubmit={submit}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New support ticket</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500"><FaClock className="size-3" /> We usually reply within a few hours {site.phoneHours}</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <FaXmark className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={120} placeholder="Short summary of the issue" className={field} />
          </label>

          <div className="flex flex-wrap gap-5">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-800">Category</p>
              <FilterSelect label="Category" Icon={FaTags} value={category} onChange={setCategory} options={TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-800">Priority</p>
              <div role="radiogroup" aria-label="Priority" className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {(Object.keys(PRIORITY) as TicketPriority[]).map((p) => {
                  const { label, Icon, dot } = PRIORITY[p];
                  return (
                    <button key={p} type="button" role="radio" aria-checked={priority === p} onClick={() => setPriority(p)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${priority === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      <Icon className={`size-3 ${dot}`} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Describe the issue</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5} maxLength={2000}
              placeholder="What happened, what you expected, and any IDs (e.g. AD-1004, INV-1001) that help us find it." className={`${field} resize-y leading-relaxed`} />
          </label>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-800">Screenshot <span className="font-normal text-slate-400">(optional)</span></p>
            <FileDrop file={file} onChange={setFile} title="Drag a screenshot here or" hint="Helps us understand faster · JPG, PNG, WebP or PDF · up to 5 MB" />
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
            <FaPaperPlane className="size-3.5" /> Submit ticket
          </button>
        </div>
      </form>
    </dialog>
  );
});

export default NewTicketDialog;
