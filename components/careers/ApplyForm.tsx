"use client";

import { useActionState } from "react";
import { FaPaperPlane, FaCircleCheck, FaCircleExclamation, FaSpinner } from "react-icons/fa6";
import { applyForJob, type ContactState } from "@/app/actions/contact";

const field = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

// Application for one position; it arrives in the super admin's Messages inbox
export default function ApplyForm({ jobId, title }: { jobId: string; title: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(applyForJob, undefined);
  const f = state?.fields ?? {};
  if (state?.sent) return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
      <span className="pop-in mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><FaCircleCheck className="size-7" /></span>
      <p className="mt-4 text-lg font-bold text-slate-900">Application sent!</p>
      <p className="mt-1 text-sm text-slate-500">Thanks for applying for {title}. We&apos;ll get back to you by email or phone.</p>
    </div>
  );
  return (
    <form key={state?.error ? JSON.stringify(f) : "apply"} action={action} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-bold text-slate-900">Apply for this role</p>
      <input type="hidden" name="jobId" value={jobId} />
      <input name="name" required defaultValue={f.name} placeholder="Full name" aria-label="Full name" autoComplete="name" className={field} />
      <input name="email" type="email" required defaultValue={f.email} placeholder="Email" aria-label="Email" autoComplete="email" className={field} />
      <input name="phone" type="tel" required defaultValue={f.phone} placeholder="Phone number" aria-label="Phone number" autoComplete="tel" className={field} />
      <input name="city" defaultValue={f.city} placeholder="City" aria-label="City" autoComplete="address-level2" className={field} />
      <textarea name="message" required minLength={20} rows={5} defaultValue={f.message} aria-label="About you"
        placeholder="A little about you and why this role. Add a link to your CV or portfolio (Google Drive, LinkedIn…)." className={`${field} resize-y leading-relaxed`} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state?.error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"><FaCircleExclamation className="shrink-0" /> {state.error}</p>}
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
        {pending ? <><FaSpinner className="animate-spin" /> Sending…</> : <><FaPaperPlane className="size-3.5" /> Send application</>}
      </button>
    </form>
  );
}
