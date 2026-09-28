"use client";

import { useRef, useState, useTransition } from "react";
import { FaPalette, FaImage, FaTrashCan, FaCloudArrowUp, FaCheck, FaCircleExclamation, FaLock, FaCrown, FaRotateLeft, FaStar, FaCopy } from "react-icons/fa6";
import { saveReviewDesign } from "@/app/actions/settings";
import { DEFAULT_THEME, THEME_COLORS, textOn } from "@/lib/site";
import { toJpeg } from "@/components/ui/toJpeg";

export type ReviewDesign = { color: string; imageUrl: string | null };

const MAX_MB = 8;

// Brand colour + header image for the public review page (Pro and Business)
export default function ReviewDesignCard({ initial, allowed, businessName, logoUrl }: { initial: ReviewDesign; allowed: boolean; businessName: string; logoUrl: string | null }) {
  const [saved, setSaved] = useState(initial);
  const [color, setColor] = useState(initial.color);
  const [image, setImage] = useState(initial.imageUrl ?? ""); // URL, new data URL, or ""
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const brand = color || DEFAULT_THEME;
  const fg = textOn(brand);
  const dirty = color !== saved.color || image !== (saved.imageUrl ?? "");
  const initials = businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  async function pick(f?: File) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setMsg({ ok: false, text: "Please choose a JPG, PNG or WebP image." });
    if (f.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `Image is too large. Max ${MAX_MB} MB.` });
    try { setImage(await toJpeg(f)); setMsg(null); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  const save = () =>
    start(async () => {
      const r = await saveReviewDesign({ color, image: image === (saved.imageUrl ?? "") ? "keep" : image });
      if (r.error) return setMsg({ ok: false, text: r.error });
      const imageUrl = r.imageUrl === undefined ? saved.imageUrl : r.imageUrl;
      setSaved({ color, imageUrl });
      setImage(imageUrl ?? "");
      setMsg({ ok: true, text: "Design saved. Your review page is updated." });
    });

  return (
    <section id="page-design" className="relative scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><FaPalette /></span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            Review page design
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800"><FaCrown className="size-2.5" /> Pro</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Match the page customers see to your brand: pick a colour and add a photo of your shop or food.</p>
        </div>
      </div>

      <div className={`mt-6 grid gap-8 lg:grid-cols-[1fr_280px] ${allowed ? "" : "pointer-events-none select-none opacity-40 blur-[1px]"}`} aria-hidden={!allowed}>
        <div className="space-y-6">
          {/* colour */}
          <div>
            <p className="text-sm font-semibold text-slate-800">Brand colour</p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {THEME_COLORS.map((c) => {
                const on = brand.toLowerCase() === c;
                return (
                  <button key={c} type="button" onClick={() => { setColor(c === DEFAULT_THEME ? "" : c); setMsg(null); }} aria-label={`Colour ${c}`} aria-pressed={on}
                    className={`grid size-10 place-items-center rounded-full transition hover:scale-110 ${on ? "ring-4 ring-offset-2 ring-slate-300" : ""}`} style={{ backgroundColor: c }}>
                    {on && <FaCheck className="size-3.5" style={{ color: textOn(c) }} />}
                  </button>
                );
              })}
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-slate-600 hover:border-slate-300">
                <span className="relative size-7 overflow-hidden rounded-full ring-1 ring-slate-200" style={{ backgroundColor: brand }}>
                  <input type="color" value={brand} onChange={(e) => { setColor(e.target.value); setMsg(null); }} aria-label="Custom colour" className="absolute inset-0 size-full cursor-pointer opacity-0" />
                </span>
                Custom
              </label>
              {color && (
                <button type="button" onClick={() => { setColor(""); setMsg(null); }} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
                  <FaRotateLeft className="size-3" /> Standard navy
                </button>
              )}
            </div>
          </div>

          {/* image */}
          <div>
            <p className="text-sm font-semibold text-slate-800">Header background image <span className="font-normal text-slate-400">(optional)</span></p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => file.current?.click()}
                className="relative grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-violet-400 hover:text-violet-600">
                {image ? <img src={image} alt="Header background" className="absolute inset-0 size-full object-cover" /> : <FaImage className="size-6" />}
              </button>
              <div className="space-y-2">
                <button type="button" onClick={() => file.current?.click()} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  <FaCloudArrowUp /> {image ? "Change image" : "Upload image"}
                </button>
                {image && (
                  <button type="button" onClick={() => { setImage(""); setMsg(null); }} className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:underline">
                    <FaTrashCan className="size-3" /> Remove image
                  </button>
                )}
                <p className="text-xs text-slate-500">A wide photo works best. JPG, PNG or WebP, up to {MAX_MB} MB.</p>
              </div>
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!dirty || pending} onClick={save}
              className="rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-40">
              {pending ? "Saving…" : "Save design"}
            </button>
            {dirty && <button type="button" onClick={() => { setColor(saved.color); setImage(saved.imageUrl ?? ""); setMsg(null); }} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Undo changes</button>}
            {msg && (
              <span role={msg.ok ? "status" : "alert"} className={`flex items-center gap-1.5 text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>
                {msg.ok ? <FaCheck /> : <FaCircleExclamation />} {msg.text}
              </span>
            )}
          </div>
        </div>

        {/* live preview */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Live preview</p>
          <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-slate-900 bg-slate-100 shadow-xl">
            <div className="relative px-4 pb-12 pt-6 text-center" style={{ backgroundColor: brand, color: fg }}>
              {image && <><img src={image} alt="" className="absolute inset-0 size-full object-cover" /><span className="absolute inset-0 bg-black/50" /></>}
              <div className="relative" style={{ color: image ? "#fff" : fg }}>
                {logoUrl
                  ? <img src={logoUrl} alt="" className="mx-auto size-12 rounded-xl object-cover ring-2 ring-white/30" />
                  : <span className="mx-auto grid size-12 place-items-center rounded-xl bg-white text-sm font-extrabold" style={{ color: brand }}>{initials}</span>}
                <p className="mt-2 text-sm font-bold">{businessName}</p>
              </div>
            </div>
            <div className="-mt-8 px-3 pb-4">
              <div className="relative rounded-xl bg-white p-3 text-center shadow">
                <p className="text-xs font-bold text-slate-900">Your review is ready</p>
                <div className="mt-1 flex justify-center gap-0.5 text-amber-400">{[0, 1, 2, 3, 4].map((i) => <FaStar key={i} className="size-2.5" />)}</div>
                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[10px] leading-relaxed text-slate-600">Loved it! Friendly staff and great quality. Will be back soon.</p>
                <span className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold" style={{ backgroundColor: brand, color: fg }}><FaCopy className="size-2.5" /> Copy &amp; open Google</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!allowed && (
        <div className="absolute inset-x-0 bottom-0 top-24 grid place-items-center p-6">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-600"><FaLock /></span>
            <p className="mt-3 font-bold text-slate-900">Available on Pro and Business</p>
            <p className="mt-1 text-sm text-slate-500">Upgrade to give your review page your own colours and a photo of your business.</p>
            <a href="/dashboard/settings?tab=subscription" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
              <FaCrown className="size-3" /> See plans
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
