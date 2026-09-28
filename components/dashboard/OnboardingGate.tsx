"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  FaTriangleExclamation, FaArrowRight, FaArrowLeft, FaGoogle, FaPhone, FaStore, FaLock, FaSpinner, FaCircleExclamation, FaRocket,
  FaChevronDown, FaTags, FaCheck, FaCommentDots, FaGlobe, FaFacebookF, FaInstagram, FaTiktok, FaShareNodes,
} from "react-icons/fa6";
import { completeOnboarding, type OnboardingState } from "@/app/actions/onboarding";
import TagInput from "@/components/ui/TagInput";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { TONES } from "@/lib/tones";
import { GOOGLE_URL_ERROR, isGoogleUrl } from "@/lib/validators";

const LATER_KEY = "onboarding-later";
const OPEN_EVENT = "onboarding:open";
const STEPS = ["Business", "Profile"];

// Any "Complete setup" button elsewhere on the page
export function OpenSetupButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className={className}>{children}</button>;
}

const field =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const label = "mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800";

// Banner + 2-step setup popup, shown until the business completes setup
export default function OnboardingGate({ businessName, ownerName }: { businessName: string; ownerName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const step1 = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, undefined);
  const [step, setStep] = useState<1 | 2>(1);
  const [products, setProducts] = useState<string[]>([]);
  const [tone, setTone] = useState(TONES[0].id);
  const [photo, setPhoto] = useState("");
  const [localError, setLocalError] = useState("");
  const f = state?.fields ?? {};
  const error = localError || state?.error;
  const initials = ownerName.split(" ").map((w) => w[0]).join("").slice(0, 2);

  // open automatically (e.g. right after signup) unless postponed in this browser session
  useEffect(() => {
    let later = false;
    try { later = sessionStorage.getItem(LATER_KEY) === "1"; } catch {}
    if (!later) dialog.current?.showModal();
    const open = () => dialog.current?.showModal();
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  // after the server answers: close on success, or jump to the step with the problem
  useEffect(() => {
    if (state?.done) dialog.current?.close();
    else if (state?.step) setStep(state.step);
  }, [state]);

  function later() {
    try { sessionStorage.setItem(LATER_KEY, "1"); } catch {}
    dialog.current?.close();
  }

  // validate step 1 in the browser before moving on
  function next() {
    const inputs = [...step1.current!.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]")];
    if (!inputs.every((el) => el.reportValidity())) return;
    const url = step1.current!.querySelector<HTMLInputElement>("input[name=googleReviewUrl]")!.value.trim();
    if (!isGoogleUrl(url)) return setLocalError(GOOGLE_URL_ERROR);
    if (!products.length) return setLocalError("Add at least one product or service.");
    setLocalError("");
    setStep(2);
  }

  return (
    <>
      {/* Banner */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <p className="flex items-center gap-2.5 text-sm text-amber-900">
            <FaTriangleExclamation className="shrink-0 text-amber-500" />
            <span><b className="font-semibold">Almost there!</b> Complete your business setup to start getting reviews.</span>
          </p>
          <button type="button" onClick={() => dialog.current?.showModal()}
            className="flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-900">
            Complete setup <FaArrowRight className="size-3" />
          </button>
        </div>
      </div>

      {/* Setup wizard */}
      <dialog ref={dialog} onCancel={later}
        className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        <div className="bg-blue-950 px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-lg font-bold"><FaRocket className="size-4 text-amber-300" /> {step === 1 ? `Set up ${businessName}` : "Your profile"}</h2>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">Step {step} of {STEPS.length}</span>
          </div>
          <p className="mt-0.5 text-sm text-blue-200">
            {step === 1 ? "Tell us about your business so the AI writes great reviews." : "Last step. Add how we can reach you."}
          </p>

          {/* Progress */}
          <ol className="mt-4 flex items-center gap-3">
            {STEPS.map((name, i) => {
              const n = i + 1;
              const done = step > n;
              return (
                <li key={name} className="flex flex-1 items-center gap-3 last:flex-none">
                  <span className={`flex items-center gap-2 text-xs font-semibold ${step >= n ? "text-white" : "text-blue-300"}`}>
                    <span className={`grid size-6 place-items-center rounded-full text-[11px] ${step >= n ? "bg-amber-300 text-blue-950" : "bg-white/10"}`}>
                      {done ? <FaCheck className="size-2.5" /> : n}
                    </span>
                    {name}
                  </span>
                  {n < STEPS.length && <span className={`h-0.5 flex-1 rounded-full ${done ? "bg-amber-300" : "bg-white/15"}`} />}
                </li>
              );
            })}
          </ol>
        </div>

        <form action={action} className="px-6 py-4">
          {error && (
            <p role="alert" className="tab-fade mb-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
              <FaCircleExclamation className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          {/* Step 1: business (kept in the DOM when hidden so its values are submitted) */}
          <div ref={step1} hidden={step !== 1} className="space-y-4">
            <div>
              <label className={label} htmlFor="ob-url"><FaGoogle className="size-3.5 text-slate-400" /> Google review link</label>
              <input id="ob-url" name="googleReviewUrl" type="url" required defaultValue={f.googleReviewUrl} onChange={() => setLocalError("")}
                placeholder="https://g.page/r/your-business/review" className={field} />
              <details className="group mt-1.5 text-xs">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-1.5 font-medium text-amber-700"><FaLock className="size-2.5" /> Locked after saving, only an admin can change it</span>
                  <span className="flex items-center gap-1 font-semibold text-blue-700">Where do I find this? <FaChevronDown className="size-2.5 transition group-open:rotate-180" /></span>
                </summary>
                <ol className="mt-2 list-decimal space-y-0.5 rounded-lg bg-slate-50 py-2 pl-8 pr-3 leading-relaxed text-slate-600">
                  <li>Open your business on Google Search or Maps while signed in.</li>
                  <li>Click <b>Ask for reviews</b> (or <b>Get more reviews</b>).</li>
                  <li>Copy the link and paste it here.</li>
                </ol>
              </details>
            </div>

            <div>
              <p className={label}><FaTags className="size-3.5 text-slate-400" /> Products & services</p>
              <TagInput value={products} onChange={(v) => { setProducts(v); setLocalError(""); }} placeholder="e.g. Haircut, Facial, Bridal makeup (press Enter to add)" />
              <input type="hidden" name="products" value={JSON.stringify(products)} />
            </div>

            <div>
              <p className={label}><FaCommentDots className="size-3.5 text-slate-400" /> Review tone</p>
              <div role="radiogroup" aria-label="Review tone" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                {TONES.map(({ id, label: name, desc, Icon }) => {
                  const on = tone === id;
                  return (
                    <button key={id} type="button" role="radio" aria-checked={on} title={desc} onClick={() => setTone(id)}
                      className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition ${on ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      <Icon className="size-3.5" /> {name}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="tone" value={tone} />
            </div>

            <div>
              <label className={label} htmlFor="ob-about"><FaStore className="size-3.5 text-slate-400" /> About your business</label>
              <textarea id="ob-about" name="description" required minLength={20} maxLength={1000} rows={3} defaultValue={f.description}
                placeholder="What you sell or offer, what makes you special, and what customers usually love. The AI uses this to write accurate reviews."
                className={`${field} resize-y leading-relaxed`} />
            </div>
          </div>

          {/* Step 2: profile */}
          <div hidden={step !== 2} className="space-y-4">
            <div>
              <PhotoUpload value={photo} onChange={setPhoto} initials={initials} />
              <input type="hidden" name="photo" value={photo} />
            </div>
            <div>
              <label className={label} htmlFor="ob-phone"><FaPhone className="size-3.5 text-slate-400" /> Phone number</label>
              <input id="ob-phone" name="phone" type="tel" required={step === 2} defaultValue={f.phone} autoComplete="tel" placeholder="+977-98XXXXXXXX" className={field} />
              <p className="mt-2 text-xs text-slate-500">We’ll only use this to contact you about your account.</p>
            </div>
            <div>
              <p className={label}><FaShareNodes className="size-3.5 text-slate-400" /> Website & social links <span className="font-normal text-slate-400">(optional)</span></p>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["websiteUrl", "Website", FaGlobe, "bg-blue-700", "https://yourbusiness.com"],
                  ["facebookUrl", "Facebook", FaFacebookF, "bg-[#1877F2]", "https://facebook.com/page"],
                  ["instagramUrl", "Instagram", FaInstagram, "bg-[#E4405F]", "https://instagram.com/page"],
                  ["tiktokUrl", "TikTok", FaTiktok, "bg-black", "https://tiktok.com/@page"],
                ] as const).map(([name, text, Icon, tint, placeholder]) => (
                  <label key={name} className="relative block">
                    <span className={`pointer-events-none absolute left-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-white ${tint}`}><Icon className="size-2.5" /></span>
                    <input name={name} type="url" defaultValue={f[name]} placeholder={placeholder} aria-label={`${text} link`} className={`${field} py-2 pl-11`} />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Shown as buttons on your review page so customers can follow you.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {step === 1 ? (
              <button type="button" onClick={later} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                I’ll do it later
              </button>
            ) : (
              <button type="button" onClick={() => { setStep(1); setLocalError(""); }} className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                <FaArrowLeft className="size-3" /> Back
              </button>
            )}
            {step === 1 ? (
              <button type="button" onClick={next} className="flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
                Continue <FaArrowRight className="size-3.5" />
              </button>
            ) : (
              <button disabled={pending} className="flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-70">
                {pending ? <><FaSpinner className="animate-spin" /> Saving…</> : <>Finish setup <FaCheck className="size-3.5" /></>}
              </button>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}
