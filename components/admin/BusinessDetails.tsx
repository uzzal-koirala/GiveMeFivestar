"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import { FaPen, FaStore, FaGoogle, FaTags, FaSliders, FaLocationDot, FaLock, FaArrowUpRightFromSquare, FaCircleExclamation, FaCheck, FaPhone, FaShareNodes, FaFacebookF, FaInstagram, FaTiktok, FaGlobe } from "react-icons/fa6";
import TagInput from "@/components/ui/TagInput";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { changeGoogleLink, updateBusinessInfo } from "@/app/actions/admin";
import { TONES } from "@/lib/tones";
import type { DetailsMode } from "@/lib/details-mode";

export type Details = {
  businessName: string; phone: string; photo: string; location: string; description: string; googleReviewUrl: string; products: string[];
  tone: string; collectOnly: boolean; detailsMode: DetailsMode;
  facebookUrl: string; instagramUrl: string; tiktokUrl: string; websiteUrl: string;
};

const SOCIALS = [
  { key: "websiteUrl", label: "Website", Icon: FaGlobe, tint: "bg-blue-700", placeholder: "https://yourbusiness.com" },
  { key: "facebookUrl", label: "Facebook", Icon: FaFacebookF, tint: "bg-blue-600", placeholder: "https://facebook.com/yourpage" },
  { key: "instagramUrl", label: "Instagram", Icon: FaInstagram, tint: "bg-pink-600", placeholder: "https://instagram.com/yourpage" },
  { key: "tiktokUrl", label: "TikTok", Icon: FaTiktok, tint: "bg-slate-900", placeholder: "https://tiktok.com/@yourpage" },
] as const;

const field = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const small = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400";
const MODES: { id: DetailsMode; label: string }[] = [{ id: "required", label: "Required" }, { id: "optional", label: "Optional" }, { id: "hidden", label: "Hidden" }];

function Pills<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; disabled?: (id: T) => boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} disabled={disabled?.(o.id)} onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${value === o.id ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// A card that shows values and, after tapping the pen, lets the admin edit and save them
function EditableCard({ title, Icon, editLabel, view, edit, onSave, onCancel, disabled }: {
  title: string; Icon: IconType; editLabel: string; view: React.ReactNode; edit: React.ReactNode;
  onSave: () => Promise<{ error?: string }>; onCancel: () => void; disabled?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <section className={`rounded-xl border bg-white p-5 shadow-sm transition ${editing ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-slate-900"><Icon className="size-3.5 text-blue-700" /> {title}</h3>
        <div className="flex items-center gap-2">
        {saved && !editing && <span className="tab-fade flex items-center gap-1 text-xs font-semibold text-emerald-700"><FaCheck /> Saved</span>}
        {!editing && !disabled && (
          <button type="button" onClick={() => { onCancel(); setEditing(true); setSaved(false); setError(""); }} aria-label={editLabel} title={editLabel}
            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-800">
            <FaPen className="size-3" />
          </button>
        )}
        </div>
      </div>
      <div className="mt-3">{editing ? edit : view}</div>
      {editing && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {error && <p role="alert" className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
          <button type="button" onClick={() => { onCancel(); setEditing(false); setError(""); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button type="button" disabled={pending}
            onClick={() => start(async () => {
              const res = await onSave();
              if (res.error) return setError(res.error);
              setEditing(false); setSaved(true); router.refresh();
            })}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </section>
  );
}

export default function BusinessDetails({ userId, slug, initial }: { userId: string; slug: string | null; initial: Details }) {
  const [d, setD] = useState(initial);
  const set = (patch: Partial<Details>) => setD((x) => ({ ...x, ...patch }));
  const reset = (...keys: (keyof Details)[]) => setD((x) => ({ ...x, ...Object.fromEntries(keys.map((k) => [k, initial[k]])) }));
  const noSetup = !slug;
  const initials = (d.businessName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const toneLabel = TONES.find((t) => t.id === d.tone)?.label ?? d.tone;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* About */}
      <div className="md:col-span-2">
        <EditableCard title="About the business" Icon={FaStore} editLabel="Edit business details"
          onSave={() => updateBusinessInfo(userId, {
            businessName: d.businessName, phone: d.phone,
            ...(d.photo !== initial.photo && { photo: d.photo }),
            ...(!noSetup && { location: d.location, description: d.description }),
          })}
          onCancel={() => reset("businessName", "phone", "photo", "location", "description")}
          view={
            <div className="flex gap-4 text-sm">
              {initial.photo
                ? <img src={initial.photo} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                : <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-blue-950 text-lg font-bold text-white">{initials}</span>}
              <div className="min-w-0 space-y-1.5">
                <p className="text-base font-semibold text-slate-900">{initial.businessName}</p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                  <span className="flex items-center gap-1.5"><FaPhone className="size-3" /> {initial.phone || "No phone"}</span>
                  {initial.location && <span className="flex items-center gap-1.5"><FaLocationDot className="size-3" /> {initial.location}</span>}
                </p>
                <p className="leading-relaxed text-slate-600">{initial.description || <span className="text-slate-400">No description yet</span>}</p>
              </div>
            </div>
          }
          edit={
            <div className="space-y-3">
              <PhotoUpload value={d.photo} onChange={(v) => set({ photo: v })} initials={initials} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label><span className={small}>Business name</span><input value={d.businessName} onChange={(e) => set({ businessName: e.target.value })} className={field} /></label>
                <label><span className={small}>Phone number</span><input value={d.phone} onChange={(e) => set({ phone: e.target.value })} type="tel" placeholder="+977-98XXXXXXXX" className={field} /></label>
                {!noSetup && <label><span className={small}>Location</span><input value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Thamel, Kathmandu" className={field} /></label>}
              </div>
              {!noSetup && (
                <label><span className={small}>Description</span>
                  <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={1000} className={`${field} resize-y leading-relaxed`} />
                </label>
              )}
            </div>
          }
        />
      </div>

      {/* Google link */}
      <EditableCard title="Google review link" Icon={FaGoogle} editLabel="Edit Google review link" disabled={noSetup}
        onSave={() => changeGoogleLink(userId, d.googleReviewUrl)} onCancel={() => reset("googleReviewUrl")}
        view={noSetup ? <p className="text-sm text-slate-400">Available after setup</p> : (
          <div className="text-sm">
            <a href={initial.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 break-all font-medium text-blue-700 hover:underline">
              {initial.googleReviewUrl} <FaArrowUpRightFromSquare className="size-2.5 shrink-0" />
            </a>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><FaLock className="size-2.5" /> Locked for the business. Only admins can change it.</p>
          </div>
        )}
        edit={<input value={d.googleReviewUrl} onChange={(e) => set({ googleReviewUrl: e.target.value })} aria-label="Google review link" className={field} />}
      />

      {/* Products */}
      <EditableCard title="Products & services" Icon={FaTags} editLabel="Edit products and services" disabled={noSetup}
        onSave={() => updateBusinessInfo(userId, { products: d.products })} onCancel={() => reset("products")}
        view={noSetup ? <p className="text-sm text-slate-400">Available after setup</p> : (
          <div className="flex flex-wrap gap-1.5">
            {initial.products.length ? initial.products.map((p) => <span key={p} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{p}</span>) : <span className="text-sm text-slate-400">None added</span>}
          </div>
        )}
        edit={<TagInput value={d.products} onChange={(v) => set({ products: v })} placeholder="Type and press Enter" />}
      />

      {/* Social links */}
      <div className="md:col-span-2">
        <EditableCard title="Website & social links" Icon={FaShareNodes} editLabel="Edit social links" disabled={noSetup}
          onSave={() => updateBusinessInfo(userId, { websiteUrl: d.websiteUrl, facebookUrl: d.facebookUrl, instagramUrl: d.instagramUrl, tiktokUrl: d.tiktokUrl })}
          onCancel={() => reset("websiteUrl", "facebookUrl", "instagramUrl", "tiktokUrl")}
          view={noSetup ? <p className="text-sm text-slate-400">Available after setup</p> : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SOCIALS.map(({ key, label, Icon, tint }) => (
                <li key={key} className="flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full text-white ${initial[key] ? tint : "bg-slate-200"}`}><Icon className="size-3.5" /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-500">{label}</span>
                    {initial[key]
                      ? <a href={initial[key]} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium text-blue-700 hover:underline">{initial[key].replace(/^https:\/\/(www\.)?/, "")}</a>
                      : <span className="block text-sm text-slate-400">Not added</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          edit={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SOCIALS.map(({ key, label, Icon, tint, placeholder }) => (
                <label key={key}>
                  <span className={`${small} flex items-center gap-1.5`}><span className={`grid size-4 place-items-center rounded-full text-white ${tint}`}><Icon className="size-2" /></span> {label}</span>
                  <input value={d[key]} onChange={(e) => set({ [key]: e.target.value })} placeholder={placeholder} aria-label={`${label} link`} className={field} />
                </label>
              ))}
            </div>
          }
        />
      </div>

      {/* Review page */}
      <div className="md:col-span-2">
        <EditableCard title="Review page & tone" Icon={FaSliders} editLabel="Edit review page settings" disabled={noSetup}
          onSave={() => updateBusinessInfo(userId, { collectOnly: d.collectOnly, detailsMode: d.detailsMode, tone: d.tone as "friendly" })}
          onCancel={() => reset("collectOnly", "detailsMode", "tone")}
          view={noSetup ? <p className="text-sm text-slate-400">Available after setup</p> : (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className={small}>Page mode</dt><dd className="font-semibold text-slate-800">{initial.collectOnly ? "Details only" : "Google review"}</dd></div>
              <div><dt className={small}>Customer details</dt><dd className="font-semibold capitalize text-slate-800">{initial.collectOnly ? "required" : initial.detailsMode}</dd></div>
              <div><dt className={small}>Review tone</dt><dd className="font-semibold text-slate-800">{TONES.find((t) => t.id === initial.tone)?.label ?? initial.tone}</dd></div>
            </dl>
          )}
          edit={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><span className={small}>Page mode</span>
                <Pills label="Page mode" value={d.collectOnly ? "collect" : "review"} options={[{ id: "review", label: "Google review" }, { id: "collect", label: "Details only" }]}
                  onChange={(v) => set(v === "collect" ? { collectOnly: true, detailsMode: "required" } : { collectOnly: false })} />
              </div>
              <div><span className={small}>Customer details</span>
                <Pills label="Customer details" value={d.detailsMode} options={MODES} onChange={(v) => set({ detailsMode: v })} disabled={(id) => d.collectOnly && id !== "required"} />
              </div>
              <div><span className={small}>Review tone · {toneLabel}</span>
                <Pills label="Review tone" value={d.tone} options={TONES.map((t) => ({ id: t.id, label: t.label }))} onChange={(v) => set({ tone: v })} />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
