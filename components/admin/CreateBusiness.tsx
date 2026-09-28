"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FaPlus, FaXmark, FaUserTie, FaIdCard, FaCrown, FaGoogle, FaNoteSticky, FaEye, FaEyeSlash, FaWandMagicSparkles, FaCopy, FaCheck, FaCircleExclamation, FaCircleInfo, FaFacebookF, FaInstagram, FaTiktok, FaGlobe,
} from "react-icons/fa6";
import { createBusiness, type NewBusiness } from "@/app/actions/admin";
import PhotoUpload from "@/components/ui/PhotoUpload";
import TagInput from "@/components/ui/TagInput";
import { TONES } from "@/lib/tones";
import { plans } from "@/lib/site";

const field = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const small = "mb-1.5 block text-xs font-semibold text-slate-600";

const EMPTY: NewBusiness = {
  name: "", businessName: "", email: "", password: "", phone: "", photo: "",
  plan: "free", months: 1, credits: 100,
  googleReviewUrl: "", products: [], location: "", description: "", tone: "friendly", note: "",
  facebookUrl: "", instagramUrl: "", tiktokUrl: "", websiteUrl: "",
};

// 12 characters, no look-alikes (0/O, 1/l)
export function makePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => chars[n % chars.length]).join("");
}

function Group({ n, Icon, title, hint, children }: { n: number; Icon: IconType; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-5">
      <legend className="flex items-center gap-2 px-1.5 text-sm font-bold text-slate-900">
        <span className="grid size-6 place-items-center rounded-full bg-blue-900 text-[11px] text-white">{n}</span>
        <Icon className="size-3.5 text-blue-800" /> {title}
      </legend>
      {hint && <p className="-mt-1 mb-4 text-xs text-slate-500">{hint}</p>}
      {children}
    </fieldset>
  );
}

export default function CreateBusiness() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [v, setV] = useState<NewBusiness>(EMPTY);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (patch: Partial<NewBusiness>) => { setV((x) => ({ ...x, ...patch })); setError(""); };
  const initials = (v.businessName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const setupNow = !!v.googleReviewUrl.trim();

  const open = () => { setV({ ...EMPTY, password: makePassword() }); setShow(true); setError(""); dialog.current?.showModal(); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createBusiness(v);
      if (r.error || !r.id) return setError(r.error ?? "Something went wrong.");
      dialog.current?.close();
      router.push(`/admin/businesses/${r.id}`);
    });
  };

  return (
    <>
      <button type="button" onClick={open}
        className="flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-bold text-blue-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-200">
        <FaPlus className="size-3" /> Add business
      </button>

      <dialog ref={dialog} aria-label="Add business" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        <form onSubmit={submit}>
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white px-6 py-4">
            <span className="grid size-10 place-items-center rounded-lg bg-blue-900 text-white"><FaPlus className="size-3.5" /></span>
            <div className="flex-1">
              <h2 className="font-bold text-slate-900">Add a business</h2>
              <p className="text-xs text-slate-500">Create the account on the owner’s behalf. Share the email and password with them.</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
          </div>

          <div className="space-y-5 p-6">
            <Group n={1} Icon={FaUserTie} title="Account & login">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label><span className={small}>Business name *</span><input required value={v.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="e.g. Himalayan Java Café" className={field} /></label>
                <label><span className={small}>Owner full name *</span><input required value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Sita Sharma" className={field} /></label>
                <label><span className={small}>Login email *</span><input required type="email" value={v.email} onChange={(e) => set({ email: e.target.value })} placeholder="owner@business.com" autoComplete="off" className={field} /></label>
                <div>
                  <span className={small}>Password *</span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input required minLength={8} value={v.password} onChange={(e) => set({ password: e.target.value })} type={show ? "text" : "password"} autoComplete="new-password" aria-label="Password" className={`${field} pr-9 font-mono`} />
                      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">{show ? <FaEyeSlash /> : <FaEye />}</button>
                    </div>
                    <button type="button" onClick={() => { set({ password: makePassword() }); setShow(true); }} title="Generate a strong password" aria-label="Generate password"
                      className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-800"><FaWandMagicSparkles className="size-3.5" /></button>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(v.password); setCopied(true); setTimeout(() => setCopied(false), 1500); }} title="Copy password" aria-label="Copy password"
                      className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-800">{copied ? <FaCheck className="size-3.5 text-emerald-600" /> : <FaCopy className="size-3.5" />}</button>
                  </div>
                </div>
              </div>
            </Group>

            <Group n={2} Icon={FaIdCard} title="Profile">
              <PhotoUpload value={v.photo} onChange={(photo) => set({ photo })} initials={initials} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label><span className={small}>Phone</span><input type="tel" value={v.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+977-98XXXXXXXX" className={field} /></label>
                <label><span className={small}>Location</span><input value={v.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Thamel, Kathmandu" className={field} /></label>
              </div>
            </Group>

            <Group n={3} Icon={FaCrown} title="Plan & credits">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto]">
                <div>
                  <span className={small}>Plan</span>
                  <div role="radiogroup" aria-label="Plan" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                    {plans.map((p) => (
                      <button key={p.id} type="button" role="radio" aria-checked={v.plan === p.id} onClick={() => set({ plan: p.id as NewBusiness["plan"] })}
                        className={`rounded-md py-1.5 text-sm font-semibold transition ${v.plan === p.id ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{p.name}</button>
                    ))}
                  </div>
                </div>
                <label hidden={v.plan === "free"}>
                  <span className={small}>Months</span>
                  <select value={v.months} onChange={(e) => set({ months: Number(e.target.value) })} aria-label="Months" className={`${field} py-2`}>
                    {[1, 2, 3, 6, 12, 24].map((m) => <option key={m} value={m}>{m === 12 ? "1 year" : m === 24 ? "2 years" : `${m} month${m > 1 ? "s" : ""}`}</option>)}
                  </select>
                </label>
                <label>
                  <span className={small}>AI credits</span>
                  <input value={v.credits} onChange={(e) => set({ credits: Number(e.target.value.replace(/\D/g, "").slice(0, 6)) })} inputMode="numeric" aria-label="AI credits" className={`${field} w-28 font-bold`} />
                </label>
              </div>
            </Group>

            <Group n={4} Icon={FaGoogle} title="Review page" hint="Optional. Add the Google link to make the review page live now, or leave it empty and the owner finishes setup when they first log in.">
              <label className="block"><span className={small}>Google review link</span>
                <input value={v.googleReviewUrl} onChange={(e) => set({ googleReviewUrl: e.target.value })} placeholder="https://g.page/r/your-business/review" className={field} />
              </label>
              <div hidden={!setupNow} className="mt-4 space-y-4">
                <div><span className={small}>Products & services *</span><TagInput value={v.products} onChange={(products) => set({ products })} placeholder="e.g. Coffee, Momo (press Enter to add)" /></div>
                <div>
                  <span className={small}>Review tone</span>
                  <div role="radiogroup" aria-label="Review tone" className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                    {TONES.map((t) => (
                      <button key={t.id} type="button" role="radio" aria-checked={v.tone === t.id} onClick={() => set({ tone: t.id as NewBusiness["tone"] })}
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${v.tone === t.id ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <label className="block"><span className={small}>About the business</span>
                  <textarea value={v.description} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={1000} placeholder="What they sell, what makes them special. The AI uses this to write accurate reviews." className={`${field} resize-y leading-relaxed`} />
                </label>
                <div>
                  <span className={small}>Website & social links <span className="font-normal text-slate-400">(shown on the review page)</span></span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      ["websiteUrl", "Website", FaGlobe, "bg-blue-700", "https://yourbusiness.com"],
                      ["facebookUrl", "Facebook", FaFacebookF, "bg-blue-600", "https://facebook.com/page"],
                      ["instagramUrl", "Instagram", FaInstagram, "bg-pink-600", "https://instagram.com/page"],
                      ["tiktokUrl", "TikTok", FaTiktok, "bg-slate-900", "https://tiktok.com/@page"],
                    ] as const).map(([key, label, Icon, tint, placeholder]) => (
                      <label key={key} className="relative block">
                        <span className={`pointer-events-none absolute left-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-white ${tint}`}><Icon className="size-2.5" /></span>
                        <input value={v[key]} onChange={(e) => set({ [key]: e.target.value })} placeholder={placeholder} aria-label={`${label} link`} className={`${field} pl-11`} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {!setupNow && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><FaCircleInfo className="size-3" /> The owner will see the setup steps after logging in.</p>}
            </Group>

            <Group n={5} Icon={FaNoteSticky} title="Admin note">
              <textarea value={v.note} onChange={(e) => set({ note: e.target.value })} rows={2} maxLength={2000} aria-label="Admin note" placeholder="Private, only super admins see this. e.g. Signed up at the Pokhara expo, paid cash." className={`${field} resize-y`} />
            </Group>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
            <button type="button" onClick={() => dialog.current?.close()} className="ml-auto rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
              <FaPlus className="size-3" /> {pending ? "Creating…" : "Create business"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
