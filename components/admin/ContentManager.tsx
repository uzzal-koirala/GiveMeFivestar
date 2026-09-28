"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FaQuoteLeft, FaBriefcase, FaNewspaper, FaPlus, FaPen, FaTrashCan, FaXmark, FaStar, FaEye, FaEyeSlash, FaArrowUpRightFromSquare,
  FaCircleExclamation, FaLocationDot, FaImage, FaCloudArrowUp, FaGoogle, FaCircleInfo, FaHandshake,
} from "react-icons/fa6";
import { deleteJob, deleteLogo, deletePost, deleteTestimonial, saveJob, saveLogo, savePost, saveTestimonial } from "@/app/actions/content";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { toJpeg } from "@/components/ui/toJpeg";
import { RichText } from "@/lib/richtext";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { JOB_TYPES } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { fmtDate } from "./ui";

export type TestimonialRow = { id: string; name: string; role: string; business: string; city: string; quote: string; rating: number; published: boolean; photoUrl: string | null };
export type JobRow = { id: string; slug: string; title: string; department: string; location: string; type: string; salary: string; summary: string; body: string; published: boolean; createdAt: string };
export type LogoRow = { id: string; name: string; url: string; published: boolean; logoUrl: string };
export type PostRow = { id: string; slug: string; title: string; excerpt: string; body: string; tags: string; author: string; seoTitle: string; seoDescription: string; published: boolean; publishedAt: string | null; coverUrl: string | null; updatedAt: string };

const field = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const small = "mb-1.5 block text-xs font-semibold text-slate-600";
const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const FORMAT_HELP = "## Heading   ### Subheading   - list item   1. numbered   > quote   **bold**   [link text](https://…)";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} /></span>
      {on ? "Published" : "Draft (hidden)"}
    </button>
  );
}
const Status = ({ on }: { on: boolean }) => (
  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${on ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
    {on ? <FaEye className="size-2.5" /> : <FaEyeSlash className="size-2.5" />} {on ? "Published" : "Draft"}
  </span>
);

// One modal shell for all three editors
function Editor({ open, title, onClose, onSave, pending, error, wide, children }: {
  open: boolean; title: string; onClose: () => void; onSave: () => void; pending: boolean; error: string; wide?: boolean; children: React.ReactNode;
}) {
  const d = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open && !d.current?.open) d.current?.showModal(); if (!open && d.current?.open) d.current.close(); }, [open]);
  return (
    <dialog ref={d} onClose={onClose} aria-label={title}
      className={`auth-dialog no-scrollbar m-auto max-h-[94vh] w-[calc(100%-2rem)] ${wide ? "max-w-5xl" : "max-w-2xl"} overflow-y-auto rounded-xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm`}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
        </div>
        <div className="space-y-5 p-6">{children}</div>
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
          <button type="button" onClick={onClose} className="ml-auto rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={pending} className="rounded-lg bg-blue-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </dialog>
  );
}

function useEditor<T>(empty: T) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: string | null; v: T } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (patch: Partial<T>) => { setEditing((e) => (e ? { ...e, v: { ...e.v, ...patch } } : e)); setError(""); };
  const save = (fn: (id: string | null, v: T) => Promise<{ error?: string }>) =>
    start(async () => { if (!editing) return; const r = await fn(editing.id, editing.v); if (r.error) return setError(r.error); setEditing(null); router.refresh(); });
  const remove = (label: string, fn: () => Promise<{ error?: string }>) =>
    start(async () => { if (!confirm(`Delete “${label}”? This can’t be undone.`)) return; await fn(); router.refresh(); });
  return { editing, open: (id: string | null, v?: T) => { setError(""); setEditing({ id, v: v ?? empty }); }, close: () => setEditing(null), set, save, remove, error, pending };
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"><FaPlus className="size-3" /> {label}</button>;
}
const IconBtn = ({ label, onClick, Icon, danger }: { label: string; onClick: () => void; Icon: IconType; danger?: boolean }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label} className={`grid size-9 place-items-center rounded-lg text-slate-400 transition ${danger ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-slate-100 hover:text-slate-700"}`}><Icon className="size-3.5" /></button>
);
const Empty = ({ Icon, text }: { Icon: IconType; text: string }) => (
  <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-white py-14 text-center"><Icon className="size-7 text-slate-200" /><p className="mt-3 text-sm text-slate-500">{text}</p></div>
);

// ---------- Testimonials ----------
type TV = { name: string; role: string; business: string; city: string; quote: string; rating: number; published: boolean; photo: string };
function Testimonials({ rows }: { rows: TestimonialRow[] }) {
  const ed = useEditor<TV>({ name: "", role: "Owner", business: "", city: "", quote: "", rating: 5, published: false, photo: "" });
  const e = ed.editing;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-slate-500"><FaCircleInfo className="size-3.5" /> Only <b>published</b> testimonials appear on the home page. Use real clients&apos; words, with their permission.</p>
        <AddButton label="Add testimonial" onClick={() => ed.open(null)} />
      </div>
      {!rows.length ? <Empty Icon={FaQuoteLeft} text="No testimonials yet." /> : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((t) => (
            <li key={t.id} className={`flex flex-col rounded-lg border bg-white p-5 shadow-sm ${t.published ? "border-slate-200" : "border-dashed border-slate-300"}`}>
              <div className="flex items-center gap-3">
                {t.photoUrl ? <img src={t.photoUrl} alt="" className="size-11 rounded-full object-cover" /> : <span className={`grid size-11 place-items-center rounded-full text-sm font-bold text-white ${colorFor(t.name)}`}>{initials(t.name)}</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{t.name}</p>
                  <p className="truncate text-xs text-slate-500">{[t.role, t.business, t.city].filter(Boolean).join(" · ")}</p>
                </div>
                <Status on={t.published} />
              </div>
              <span className="mt-3 flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <FaStar key={i} className={`size-3 ${i <= t.rating ? "text-amber-400" : "text-slate-200"}`} />)}</span>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                <IconBtn label="Edit testimonial" Icon={FaPen} onClick={() => ed.open(t.id, { name: t.name, role: t.role, business: t.business, city: t.city, quote: t.quote, rating: t.rating, published: t.published, photo: t.photoUrl ?? "" })} />
                <IconBtn label="Delete testimonial" Icon={FaTrashCan} danger onClick={() => ed.remove(t.name, () => deleteTestimonial(t.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Editor open={!!e} title={e?.id ? "Edit testimonial" : "Add testimonial"} onClose={ed.close} pending={ed.pending} error={ed.error}
        onSave={() => ed.save((id, v) => saveTestimonial(id, { ...v, photo: id && v.photo === rows.find((r) => r.id === id)?.photoUrl ? "keep" : v.photo }))}>
        {e && <>
          <PhotoUpload value={e.v.photo} onChange={(photo) => ed.set({ photo })} initials={initials(e.v.name || "?")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label><span className={small}>Client name</span><input required value={e.v.name} onChange={(x) => ed.set({ name: x.target.value })} placeholder="e.g. Sita Gurung" className={field} /></label>
            <label><span className={small}>Role</span><input value={e.v.role} onChange={(x) => ed.set({ role: x.target.value })} placeholder="e.g. Owner" className={field} /></label>
            <label><span className={small}>Business</span><input required value={e.v.business} onChange={(x) => ed.set({ business: x.target.value })} placeholder="e.g. Himalayan Java Café" className={field} /></label>
            <label><span className={small}>City</span><input value={e.v.city} onChange={(x) => ed.set({ city: x.target.value })} placeholder="e.g. Pokhara" className={field} /></label>
          </div>
          <div><span className={small}>Rating</span>
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onClick={() => ed.set({ rating: i })} aria-label={`${i} stars`}><FaStar className={`size-6 ${i <= e.v.rating ? "text-amber-400" : "text-slate-200"}`} /></button>
            ))}</div>
          </div>
          <label className="block"><span className={small}>What they said · {e.v.quote.length}/500</span>
            <textarea required value={e.v.quote} onChange={(x) => ed.set({ quote: x.target.value.slice(0, 500) })} rows={4} className={`${field} resize-y leading-relaxed`} placeholder="Their words about Give Me Five Star…" />
          </label>
          <Toggle on={e.v.published} onChange={(published) => ed.set({ published })} label="Published" />
        </>}
      </Editor>
    </div>
  );
}

// ---------- Brand logos ----------
type LV = { name: string; url: string; published: boolean; logo: string };
function Logos({ rows }: { rows: LogoRow[] }) {
  const ed = useEditor<LV>({ name: "", url: "", published: true, logo: "" });
  const e = ed.editing;
  const file = useRef<HTMLInputElement>(null);
  const [imgErr, setImgErr] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-slate-500"><FaCircleInfo className="size-3.5" /> Shown under the hero as &ldquo;Brands we&apos;ve worked with&rdquo;. Only add brands you really work with, with their permission.</p>
        <AddButton label="Add logo" onClick={() => { setImgErr(""); ed.open(null); }} />
      </div>
      {!rows.length ? <Empty Icon={FaHandshake} text="No logos yet. The strip stays hidden on the home page until you add one." /> : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((l) => (
            <li key={l.id} className={`rounded-lg border bg-white p-4 shadow-sm ${l.published ? "border-slate-200" : "border-dashed border-slate-300"}`}>
              <div className="grid h-20 place-items-center rounded-md bg-slate-50"><img src={l.logoUrl} alt={l.name} className="max-h-12 max-w-[80%] object-contain" /></div>
              <div className="mt-3 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{l.name}</p>
                <Status on={l.published} />
              </div>
              <div className="mt-2 flex justify-end gap-1 border-t border-slate-100 pt-2">
                <IconBtn label="Edit logo" Icon={FaPen} onClick={() => { setImgErr(""); ed.open(l.id, { name: l.name, url: l.url, published: l.published, logo: l.logoUrl }); }} />
                <IconBtn label="Delete logo" Icon={FaTrashCan} danger onClick={() => ed.remove(l.name, () => deleteLogo(l.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Editor open={!!e} title={e?.id ? "Edit logo" : "Add logo"} onClose={ed.close} pending={ed.pending} error={ed.error || imgErr}
        onSave={() => ed.save((id, v) => saveLogo(id, { ...v, logo: v.logo.startsWith("data:") ? v.logo : "keep" }))}>
        {e && <>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => file.current?.click()} aria-label="Upload logo"
              className="grid h-24 w-48 place-items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-blue-400 hover:text-blue-600">
              {e.v.logo ? <img src={e.v.logo} alt="Logo preview" className="max-h-16 max-w-[85%] object-contain" /> : <FaImage className="size-6" />}
            </button>
            <div className="space-y-1.5">
              <button type="button" onClick={() => file.current?.click()} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <FaCloudArrowUp /> {e.v.logo ? "Change logo" : "Upload logo"}
              </button>
              <p className="text-xs text-slate-500">PNG with a transparent background looks best.</p>
            </div>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden
              onChange={async (x) => { const f = x.target.files?.[0]; x.target.value = ""; if (!f) return; try { setImgErr(""); ed.set({ logo: await toJpeg(f, 600, 1, "image/png") }); } catch (err) { setImgErr((err as Error).message); } }} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label><span className={small}>Brand name</span><input required value={e.v.name} onChange={(x) => ed.set({ name: x.target.value })} placeholder="e.g. Himalayan Java" className={field} /></label>
            <label><span className={small}>Website <span className="font-normal text-slate-400">(optional)</span></span><input type="url" value={e.v.url} onChange={(x) => ed.set({ url: x.target.value })} placeholder="https://…" className={field} /></label>
          </div>
          <Toggle on={e.v.published} onChange={(published) => ed.set({ published })} label="Published" />
        </>}
      </Editor>
    </div>
  );
}

// ---------- Careers ----------
type JV = { title: string; department: string; location: string; type: (typeof JOB_TYPES)[number]; salary: string; summary: string; body: string; published: boolean };
function Careers({ rows }: { rows: JobRow[] }) {
  const ed = useEditor<JV>({ title: "", department: "", location: "Kathmandu", type: "Full-time", salary: "", summary: "", published: true,
    body: "## About the role\n\nWhat this person will do.\n\n## What you'll do\n\n- First responsibility\n- Second responsibility\n\n## What we're looking for\n\n- Skill or experience\n- Another one" });
  const e = ed.editing;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Published positions show on the <a href="/careers" target="_blank" className="font-semibold text-blue-700 hover:underline">Careers page</a>. Applications arrive in Messages.</p>
        <AddButton label="Add position" onClick={() => ed.open(null)} />
      </div>
      {!rows.length ? <Empty Icon={FaBriefcase} text="No positions yet." /> : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {rows.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-800"><FaBriefcase className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-bold leading-snug text-slate-900 sm:truncate">{j.title}</p>
                <span className="mt-1 inline-block sm:hidden"><Status on={j.published} /></span>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">{j.department} · <FaLocationDot className="size-2.5" /> {j.location} · {j.type}{j.salary && ` · ${j.salary}`}</p>
              </div>
              <span className="hidden sm:inline-flex"><Status on={j.published} /></span>
              <div className="-my-1 flex w-full justify-end gap-1 border-t border-slate-100 pt-1 sm:my-0 sm:w-auto sm:border-0 sm:pt-0">
                <a href={`/careers/${j.slug}`} target="_blank" aria-label="View on site" title="View on site" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaArrowUpRightFromSquare className="size-3.5" /></a>
                <IconBtn label="Edit position" Icon={FaPen} onClick={() => ed.open(j.id, { title: j.title, department: j.department, location: j.location, type: j.type as JV["type"], salary: j.salary, summary: j.summary, body: j.body, published: j.published })} />
                <IconBtn label="Delete position" Icon={FaTrashCan} danger onClick={() => ed.remove(j.title, () => deleteJob(j.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Editor wide open={!!e} title={e?.id ? "Edit position" : "Add position"} onClose={ed.close} pending={ed.pending} error={ed.error} onSave={() => ed.save((id, v) => saveJob(id, v))}>
        {e && <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="sm:col-span-2 lg:col-span-3"><span className={small}>Job title</span><input required value={e.v.title} onChange={(x) => ed.set({ title: x.target.value })} placeholder="e.g. Sales Executive" className={field} /></label>
            <label><span className={small}>Department</span><input required value={e.v.department} onChange={(x) => ed.set({ department: x.target.value })} placeholder="e.g. Sales" className={field} /></label>
            <label><span className={small}>Location</span><input required value={e.v.location} onChange={(x) => ed.set({ location: x.target.value })} placeholder="e.g. Kathmandu or Remote" className={field} /></label>
            <label><span className={small}>Type</span><select value={e.v.type} onChange={(x) => ed.set({ type: x.target.value as JV["type"] })} className={field}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label><span className={small}>Salary <span className="font-normal text-slate-400">(optional)</span></span><input value={e.v.salary} onChange={(x) => ed.set({ salary: x.target.value })} placeholder="e.g. Rs 40,000–60,000 / month" className={field} /></label>
            <label className="sm:col-span-2"><span className={small}>One-line summary</span><input required value={e.v.summary} onChange={(x) => ed.set({ summary: x.target.value })} placeholder="Shown on the careers list" className={field} /></label>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block"><span className={small}>Description</span>
              <textarea required value={e.v.body} onChange={(x) => ed.set({ body: x.target.value })} rows={16} className={`${field} resize-y font-mono text-[13px] leading-relaxed`} />
              <span className="mt-1.5 block text-[11px] text-slate-400">{FORMAT_HELP}</span>
            </label>
            <div><span className={small}>Preview</span><div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 p-5 [&_*]:!text-sm"><RichText text={e.v.body} /></div></div>
          </div>
          <Toggle on={e.v.published} onChange={(published) => ed.set({ published })} label="Published" />
        </>}
      </Editor>
    </div>
  );
}

// ---------- Blog ----------
type BV = { title: string; slug: string; excerpt: string; body: string; tags: string; author: string; seoTitle: string; seoDescription: string; published: boolean; cover: string };
function Blog({ rows, siteUrl }: { rows: PostRow[]; siteUrl: string }) {
  const ed = useEditor<BV>({ title: "", slug: "", excerpt: "", body: "## Introduction\n\nStart writing here…", tags: "", author: "", seoTitle: "", seoDescription: "", published: false, cover: "" });
  const e = ed.editing;
  const [preview, setPreview] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const coverInput = useRef<HTMLInputElement>(null);
  const slug = e ? slugify(e.v.slug || e.v.title) : "";
  const gTitle = e ? (e.v.seoTitle || e.v.title || "Post title") : "";
  const gDesc = e ? (e.v.seoDescription || e.v.excerpt || "Summary of the post…") : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Published posts appear on the <a href="/blog" target="_blank" className="font-semibold text-blue-700 hover:underline">Blog</a> and in the sitemap for Google.</p>
        <AddButton label="New post" onClick={() => { setPreview(false); ed.open(null); }} />
      </div>
      {!rows.length ? <Empty Icon={FaNewspaper} text="No posts yet." /> : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100">{p.coverUrl ? <img src={p.coverUrl} alt="" className="size-full object-cover" /> : <FaImage className="text-slate-300" />}</span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-bold leading-snug text-slate-900 sm:truncate">{p.title}</p>
                <span className="mt-1 inline-block sm:hidden"><Status on={p.published} /></span>
                <p className="truncate text-xs text-slate-500">/blog/{p.slug} · {p.published && p.publishedAt ? `Published ${fmtDate(p.publishedAt)}` : `Edited ${fmtDate(p.updatedAt)}`}{p.tags && ` · ${p.tags}`}</p>
              </div>
              <span className="hidden sm:inline-flex"><Status on={p.published} /></span>
              <div className="-my-1 flex w-full justify-end gap-1 border-t border-slate-100 pt-1 sm:my-0 sm:w-auto sm:border-0 sm:pt-0">
                {p.published && <a href={`/blog/${p.slug}`} target="_blank" aria-label="View on site" title="View on site" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaArrowUpRightFromSquare className="size-3.5" /></a>}
                <IconBtn label="Edit post" Icon={FaPen} onClick={() => { setPreview(false); ed.open(p.id, { title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body, tags: p.tags, author: p.author, seoTitle: p.seoTitle, seoDescription: p.seoDescription, published: p.published, cover: p.coverUrl ?? "" }); }} />
                <IconBtn label="Delete post" Icon={FaTrashCan} danger onClick={() => ed.remove(p.title, () => deletePost(p.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Editor wide open={!!e} title={e?.id ? "Edit post" : "New post"} onClose={ed.close} pending={ed.pending} error={ed.error || imgErr}
        onSave={() => ed.save((id, v) => savePost(id, { ...v, cover: id && v.cover === rows.find((r) => r.id === id)?.coverUrl ? "keep" : v.cover }))}>
        {e && <>
          <label className="block"><span className={small}>Title</span><input required value={e.v.title} onChange={(x) => ed.set({ title: x.target.value })} placeholder="e.g. 7 easy ways to get more Google reviews in Nepal" className={`${field} text-base font-semibold`} /></label>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <label className="block"><span className={small}>Web address</span>
                <span className="flex items-center rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                  <span className="pl-3 text-sm text-slate-400">/blog/</span>
                  <input value={e.v.slug} onChange={(x) => ed.set({ slug: x.target.value })} placeholder={slug || "auto-from-title"} className="w-full bg-transparent px-1 py-2.5 text-sm outline-none" />
                </span>
              </label>
              <label className="block"><span className={small}>Summary · {e.v.excerpt.length}/300</span><textarea required value={e.v.excerpt} onChange={(x) => ed.set({ excerpt: x.target.value.slice(0, 300) })} rows={2} className={`${field} resize-none`} placeholder="One or two sentences shown on the blog list." /></label>
            </div>
            <div><span className={small}>Cover image</span>
              <button type="button" onClick={() => coverInput.current?.click()} className="group relative grid h-[124px] w-full place-items-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-blue-400">
                {e.v.cover ? <img src={e.v.cover} alt="" className="absolute inset-0 size-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-xs font-semibold"><FaCloudArrowUp className="size-5" /> Upload cover</span>}
              </button>
              {e.v.cover && <button type="button" onClick={() => ed.set({ cover: "" })} className="mt-1 text-xs font-semibold text-rose-600 hover:underline">Remove cover</button>}
              <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (x) => { const f = x.target.files?.[0]; x.target.value = ""; if (!f) return; try { setImgErr(""); ed.set({ cover: await toJpeg(f) }); } catch (err) { setImgErr((err as Error).message); } }} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Post</span>
              <div className="flex gap-1 rounded-md bg-slate-100 p-0.5 text-xs font-semibold">
                {[["Write", false], ["Preview", true]].map(([l, v]) => <button key={String(l)} type="button" onClick={() => setPreview(v as boolean)} className={`rounded px-3 py-1 ${preview === v ? "bg-white text-blue-900 shadow-sm" : "text-slate-500"}`}>{l}</button>)}
              </div>
            </div>
            {preview
              ? <div className="min-h-[340px] rounded-lg border border-slate-200 p-6"><RichText text={e.v.body} /></div>
              : <textarea required value={e.v.body} onChange={(x) => ed.set({ body: x.target.value })} rows={16} className={`${field} resize-y font-mono text-[13px] leading-relaxed`} />}
            <span className="mt-1.5 block text-[11px] text-slate-400">{FORMAT_HELP}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label><span className={small}>Tags <span className="font-normal text-slate-400">(comma separated)</span></span><input value={e.v.tags} onChange={(x) => ed.set({ tags: x.target.value })} placeholder="Google reviews, Restaurants, Tips" className={field} /></label>
            <label><span className={small}>Author <span className="font-normal text-slate-400">(defaults to you)</span></span><input value={e.v.author} onChange={(x) => ed.set({ author: x.target.value })} placeholder="e.g. Give Me Five Star Team" className={field} /></label>
          </div>
          {/* SEO */}
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-500"><FaGoogle className="text-blue-600" /> Google search preview</legend>
            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
              <p className="truncate text-xs text-slate-500">{siteUrl.replace(/^https?:\/\//, "")} › blog › {slug || "…"}</p>
              <p className="mt-0.5 truncate text-lg text-[#1a0dab]">{gTitle.length > 60 ? `${gTitle.slice(0, 60)}…` : gTitle}</p>
              <p className="line-clamp-2 text-sm text-slate-600">{gDesc.length > 160 ? `${gDesc.slice(0, 160)}…` : gDesc}</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label><span className={small}>SEO title · <span className={e.v.seoTitle.length > 60 ? "text-amber-600" : ""}>{e.v.seoTitle.length}/60</span></span><input value={e.v.seoTitle} maxLength={70} onChange={(x) => ed.set({ seoTitle: x.target.value })} placeholder="Leave empty to use the title" className={field} /></label>
              <label><span className={small}>SEO description · <span className={e.v.seoDescription.length > 155 ? "text-amber-600" : ""}>{e.v.seoDescription.length}/155</span></span><input value={e.v.seoDescription} maxLength={160} onChange={(x) => ed.set({ seoDescription: x.target.value })} placeholder="Leave empty to use the summary" className={field} /></label>
            </div>
          </fieldset>
          <Toggle on={e.v.published} onChange={(published) => ed.set({ published })} label="Published" />
        </>}
      </Editor>
    </div>
  );
}

const TABS = [
  { id: "testimonials", label: "Testimonials", Icon: FaQuoteLeft },
  { id: "logos", label: "Logos", Icon: FaHandshake },
  { id: "careers", label: "Careers", Icon: FaBriefcase },
  { id: "blog", label: "Blog", Icon: FaNewspaper },
] as const;

export default function ContentManager({ testimonials, logos, jobs, posts, siteUrl }: { testimonials: TestimonialRow[]; logos: LogoRow[]; jobs: JobRow[]; posts: PostRow[]; siteUrl: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("testimonials");
  useEffect(() => { const t = new URLSearchParams(location.search).get("tab"); if (TABS.some((x) => x.id === t)) setTab(t as typeof tab); }, []);
  const counts = { testimonials: testimonials.length, logos: logos.length, careers: jobs.length, blog: posts.length };
  return (
    <div className="space-y-5">
      <div role="tablist" className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} aria-label={label} title={label} onClick={() => { setTab(id); history.replaceState(null, "", `?tab=${id}`); }}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md sm:gap-2 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            <Icon className="size-3.5 shrink-0" /> <span className="hidden sm:inline">{label}</span>
            <span className={`rounded-full px-1.5 text-xs ${tab === id ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{counts[id]}</span>
          </button>
        ))}
      </div>
      {tab === "testimonials" && <Testimonials rows={testimonials} />}
      {tab === "logos" && <Logos rows={logos} />}
      {tab === "careers" && <Careers rows={jobs} />}
      {tab === "blog" && <Blog rows={posts} siteUrl={siteUrl} />}
    </div>
  );
}
