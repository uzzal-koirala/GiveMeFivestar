"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok, FaGlobe, FaCircleExclamation, FaArrowUpRightFromSquare, FaLock } from "react-icons/fa6";
import type { DetailsMode } from "@/lib/details-mode";
import { saveReviewPage } from "@/app/actions/settings";

export type ReviewPageSettings = { slug: string; collectOnly: boolean; detailsMode: DetailsMode; facebookUrl: string; instagramUrl: string; tiktokUrl: string; websiteUrl: string };
export type ReviewPageCardHandle = { save: () => Promise<boolean>; discard: () => void };
type SocialKey = "websiteUrl" | "facebookUrl" | "instagramUrl" | "tiktokUrl";
type Values = { collectOnly: boolean; detailsMode: DetailsMode } & Record<SocialKey, string>;

const PURPOSES = [
  { id: "review", label: "Google review", desc: "AI writes a review and the customer posts it on Google." },
  { id: "collect", label: "Details only", desc: "Save the customer’s details and rating, then say thank you." },
];
const MODES: { id: DetailsMode; label: string; desc: string }[] = [
  { id: "required", label: "Required", desc: "Customers must enter their name, phone and city." },
  { id: "optional", label: "Optional", desc: "Customers can skip it." },
  { id: "hidden", label: "Hidden", desc: "Not asked. Customers go straight to rating." },
];
const SOCIALS: { name: SocialKey; label: string; Icon: typeof FaFacebook; color: string; placeholder: string }[] = [
  { name: "websiteUrl", label: "Website", Icon: FaGlobe, color: "text-blue-700", placeholder: "yourbusiness.com" },
  { name: "facebookUrl", label: "Facebook", Icon: FaFacebook, color: "text-[#1877F2]", placeholder: "facebook.com/yourpage" },
  { name: "instagramUrl", label: "Instagram", Icon: FaInstagram, color: "text-[#E4405F]", placeholder: "instagram.com/yourpage" },
  { name: "tiktokUrl", label: "TikTok", Icon: FaTiktok, color: "text-slate-900", placeholder: "tiktok.com/@yourpage" },
];

// Small pill switch used for each choice
function Segmented<T extends string>({ label, value, options, onChange, disabled }: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: (id: T) => boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => {
        const off = disabled?.(o.id);
        return (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} disabled={off} onClick={() => onChange(o.id)}
            title={off ? "Locked to Required in “Details only” mode" : undefined}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${value === o.id ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Row({ title, desc, locked, children }: { title: string; desc: string; locked?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          {title} {locked && <FaLock className="size-3 text-slate-400" aria-label="Locked" />}
        </p>
        <p key={desc} className="tab-fade mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const toValues = (s: ReviewPageSettings): Values => ({
  collectOnly: s.collectOnly, detailsMode: s.detailsMode, facebookUrl: s.facebookUrl, instagramUrl: s.instagramUrl, tiktokUrl: s.tiktokUrl, websiteUrl: s.websiteUrl,
});

// Saved to the database through the page's shared "unsaved changes" bar (Settings calls save/discard via the ref).
const ReviewPageCard = forwardRef<ReviewPageCardHandle, { initial: ReviewPageSettings | null; onDirtyChange: (dirty: boolean) => void }>(
  function ReviewPageCard({ initial, onDirtyChange }, ref) {
    const [baseline, setBaseline] = useState<Values | null>(initial && toValues(initial));
    const [v, setV] = useState<Values | null>(baseline);
    const [error, setError] = useState("");
    const dirty = !!v && JSON.stringify(v) !== JSON.stringify(baseline);

    useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

    useImperativeHandle(ref, () => ({
      async save() {
        if (!v || !dirty) return true;
        const data = new FormData();
        for (const [k, val] of Object.entries(v)) data.set(k, typeof val === "boolean" ? (val ? "on" : "off") : val);
        const res = await saveReviewPage(undefined, data);
        if (res?.error) { setError(res.error); return false; }
        setError("");
        setBaseline(v);
        return true;
      },
      discard() {
        setV(baseline);
        setError("");
      },
    }), [v, dirty, baseline]);

    if (!initial || !v) {
      return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Customer review page</h2>
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">Finish your business setup first to customise your review page.</p>
        </section>
      );
    }

    const update = (patch: Partial<Values>) => { setV({ ...v, ...patch }); setError(""); };
    // "Details only" exists to collect details, so the details step is locked to Required
    const choosePurpose = (id: string) => update(id === "collect" ? { collectOnly: true, detailsMode: "required" } : { collectOnly: false });
    const purpose = v.collectOnly ? PURPOSES[1] : PURPOSES[0];
    const detailDesc = v.collectOnly ? "Always required in “Details only” mode." : MODES.find((m) => m.id === v.detailsMode)!.desc;

    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Customer review page</h2>
            <p className="mt-1 text-sm text-slate-500">What customers see after scanning your QR code.</p>
          </div>
          <a href={`/r/${initial.slug}`} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
            Preview <FaArrowUpRightFromSquare className="size-3" />
          </a>
        </div>

        {error && (
          <p role="alert" className="tab-fade mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <FaCircleExclamation className="shrink-0" /> {error}
          </p>
        )}

        <div className="mt-2 divide-y divide-slate-100">
          <Row title="Page mode" desc={purpose.desc}>
            <Segmented label="Page mode" value={purpose.id} options={PURPOSES} onChange={choosePurpose} />
          </Row>

          <Row title="Ask customer details" desc={detailDesc} locked={v.collectOnly}>
            <Segmented label="Tell us about you step" value={v.detailsMode} options={MODES} onChange={(detailsMode) => update({ detailsMode })}
              disabled={(id) => v.collectOnly && id !== "required"} />
          </Row>

          <div id="social-links" className="scroll-mt-28 pt-5">
            <p className="font-semibold text-slate-900">Website & social links</p>
            <p className="mt-0.5 text-sm text-slate-500">Shown as buttons on your page. Leave empty to hide.</p>
            <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {SOCIALS.map(({ name, label, Icon, color, placeholder }) => (
                <label key={name} className="flex items-center gap-3 bg-white px-4 transition focus-within:bg-blue-50/40">
                  <Icon className={`size-4 shrink-0 ${color}`} />
                  <span className="w-20 shrink-0 text-sm font-medium text-slate-600">{label}</span>
                  <input name={name} type="url" value={v[name]} onChange={(e) => update({ [name]: e.target.value })}
                    placeholder={`https://${placeholder}`} aria-label={`${label} page link`}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

export default ReviewPageCard;
