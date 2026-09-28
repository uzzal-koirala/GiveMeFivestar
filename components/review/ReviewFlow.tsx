"use client";

import { DEFAULT_THEME, textOn } from "@/lib/site";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  FaStar, FaUser, FaPhone, FaLocationDot, FaWandMagicSparkles, FaCircleExclamation, FaCopy, FaGoogle, FaCheck,
  FaArrowLeft, FaArrowRight, FaPenToSquare, FaArrowUpRightFromSquare, FaRotate, FaBagShopping, FaWhatsapp, FaFacebookF, FaInstagram, FaTiktok, FaPaperPlane, FaHeart, FaGlobe,
} from "react-icons/fa6";
import { MdQrCode2 } from "react-icons/md";
import { writeReview, saveChosenReview, type ReviewState } from "@/app/actions/review";
import type { DetailsMode } from "@/lib/details-mode";

const RATING_LABELS = ["", "Very poor", "Poor", "Okay", "Good", "Excellent"];
const ALL_STEPS = ["About you", "Your experience"];
const LOADING_LINES = ["Reading your rating…", "Picking the right words…", "Writing your review…"];
const SENDING_LINES = ["Sending your feedback…"];
const MIN_LOADING_MS = 1800; // keep the loader on screen long enough to feel intentional
const PHONE = /^\+?[0-9][0-9\s-]{6,17}$/;

const field =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

function IconInput({ Icon, ...props }: { Icon: typeof FaUser } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
      <input {...props} className={field} />
    </div>
  );
}

// copy with a fallback for browsers that block the async clipboard API
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
}

function StepIndicator({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="px-6 pt-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Step {step} of {steps.length}</p>
        <p className="text-xs font-medium text-slate-400">{steps[step - 1]}</p>
      </div>
      <ol className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }} aria-label={`Step ${step} of ${steps.length}`}>
        {steps.map((name, i) => (
          <li key={name} aria-current={step === i + 1 ? "step" : undefined} className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span className={`block h-full rounded-full bg-amber-400 transition-all duration-500 ${step > i ? "w-full" : "w-0"}`} />
            <span className="sr-only">{name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Screen = 1 | 2 | "loading" | "review" | "thanks";

const SOCIAL_BUTTONS = [
  { key: "website", label: "Website", Icon: FaGlobe, cls: "bg-blue-700 hover:bg-blue-600" },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF, cls: "bg-[#1877F2] hover:bg-[#166fe5]" },
  { key: "instagram", label: "Instagram", Icon: FaInstagram, cls: "bg-[#E4405F] hover:bg-[#d63a56]" },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok, cls: "bg-black ring-1 ring-white/20 hover:bg-slate-900" },
] as const;

export default function ReviewFlow({ slug, businessName, description, phone, logoUrl, googleReviewUrl, products, detailsMode, collectOnly, socials, theme, branded = false }: {
  slug: string;
  businessName: string;
  description: string;
  phone: string;
  logoUrl: string | null;
  googleReviewUrl: string;
  products: string[];
  detailsMode: DetailsMode;
  collectOnly: boolean;
  socials: Record<"website" | "facebook" | "instagram" | "tiktok", string>;
  theme?: { color: string; imageUrl: string | null }; // Pro/Business page design
  branded?: boolean; // Free plan: show the floating "Powered by Give Me Five Star" badge
}) {
  const [state, action] = useActionState<ReviewState, FormData>(writeReview, undefined);
  const hideDetails = detailsMode === "hidden";
  const steps = hideDetails ? ALL_STEPS.slice(1) : ALL_STEPS;
  const [screen, setScreen] = useState<Screen>(hideDetails ? 2 : 1);
  const [v, setV] = useState({ customerName: "", customerPhone: "", location: "", product: "", feedback: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");
  const [choice, setChoice] = useState(0);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [line, setLine] = useState(0);
  const startedAt = useRef(0);

  const initials = businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const whatsapp = phone.replace(/\D/g, "");
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setError(""); };

  // server answered: show the review (after a short minimum loader) or go back to the step with the problem
  useEffect(() => {
    if (!state) return;
    if (state.error) {
      setError(state.error);
      setScreen(hideDetails ? 2 : state.step ?? 1); // never return to a hidden step
      return;
    }
    const wait = Math.max(0, (state.thanks ? 900 : MIN_LOADING_MS) - (Date.now() - startedAt.current));
    if (state.thanks) {
      const t = setTimeout(() => setScreen("thanks"), wait);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setChoice(0);
      setText(state.reviews![0]);
      setCopied(false);
      setScreen("review");
    }, wait);
    return () => clearTimeout(t);
  }, [state]);

  // rotate the loader messages
  useEffect(() => {
    if (screen !== "loading") return;
    setLine(0);
    const t = setInterval(() => setLine((l) => Math.min(l + 1, loadingLines.length - 1)), 700);
    return () => clearInterval(t);
  }, [screen]);

  function skipDetails() {
    setV({ ...v, customerName: "", customerPhone: "", location: "" });
    setError("");
    setScreen(2);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    if (screen === 1) {
      e.preventDefault(); // step 1 only moves forward
      if (v.customerName.trim().length < 2) return setError("Please enter your full name.");
      if (!PHONE.test(v.customerPhone.trim())) return setError("Please enter a valid phone number.");
      if (v.location.trim().length < 2) return setError("Please enter your city or area.");
      setError("");
      return setScreen(2);
    }
    if (!v.product.trim()) { e.preventDefault(); return setError("Tell us what you bought or tried."); }
    if (!rating) { e.preventDefault(); return setError("Tap a star to rate your experience."); }
    startedAt.current = Date.now();
    setError("");
    setScreen("loading"); // the form still submits to the server action
  }

  async function copyAndOpen() {
    await copyText(text);
    setCopied(true);
    if (state?.submissionId) saveChosenReview(state.submissionId, text);
    // still inside the tap, so the new tab isn't blocked; fall back to same tab if it is
    // ("noopener" would make window.open always return null, so detach the opener by hand)
    const tab = window.open(googleReviewUrl, "_blank");
    if (tab) tab.opener = null;
    else location.href = googleReviewUrl;
  }

  const reviews = state?.reviews ?? [];
  const loadingLines = collectOnly ? SENDING_LINES : LOADING_LINES;
  const firstName = v.customerName.trim().split(" ")[0];
  const followLinks = SOCIAL_BUTTONS.filter((s) => socials[s.key]);
  // example from the owner's products: up to 3 that fit in a phone-width input
  const productHint = `e.g. ${products.reduce<string[]>((acc, p) => (acc.length < 3 && [...acc, p].join(", ").length <= 24 ? [...acc, p] : acc), []).join(", ") || "Chicken momo, Haircut"}`;
  const shownStars = hover || rating;

  // brand colour: header + main buttons (standard navy when not customised); text flips to dark on light colours
  const header = theme?.color || DEFAULT_THEME;
  const button = theme?.color || "#1e3a8a";
  const headerFg = theme?.imageUrl ? "#ffffff" : textOn(header);
  const brandVars = { "--brand": button, "--brand-fg": textOn(button) } as React.CSSProperties;

  return (
    <div className="min-h-dvh bg-slate-100" style={brandVars}>
      {/* Business header */}
      <header className="relative overflow-hidden px-5 pb-24 pt-8 text-center" style={{ backgroundColor: header, color: headerFg }}>
        {theme?.imageUrl && <><img src={theme.imageUrl} alt="" className="absolute inset-0 size-full object-cover" /><span className="absolute inset-0 bg-black/55" /></>}
        <div className="relative">
          {logoUrl ? (
            <img src={logoUrl} alt={`${businessName} logo`} className="mx-auto size-20 rounded-2xl bg-white object-cover shadow-lg ring-4 ring-white/15" />
          ) : (
            <span className="mx-auto grid size-20 place-items-center rounded-2xl bg-white text-2xl font-extrabold shadow-lg ring-4 ring-white/15" style={{ color: header }}>{initials}</span>
          )}
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{businessName}</h1>
          {description && <p className="mx-auto mt-1.5 line-clamp-2 max-w-xs text-sm leading-relaxed opacity-80">{description}</p>}

          {(phone || SOCIAL_BUTTONS.some((s) => socials[s.key])) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {phone && <a href={`tel:${phone}`} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-current/15 transition hover:bg-white/20">
                <FaPhone className="size-3" /> {phone}
              </a>}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  className="grid size-9 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400">
                  <FaWhatsapp className="size-4" />
                </a>
              )}
              {SOCIAL_BUTTONS.filter((s) => socials[s.key]).map(({ key, label, Icon, cls }) => (
                <a key={key} href={socials[key]} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                  className={`grid size-9 place-items-center rounded-full text-white transition ${cls}`}>
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="relative mx-auto -mt-16 max-w-md px-4 pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
          {typeof screen === "number" && <StepIndicator step={hideDetails ? 1 : screen} steps={steps} />}

          <div className="p-6">
            {error && (
              <p role="alert" className="tab-fade mb-4 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                <FaCircleExclamation className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            {/* Both steps share one form so everything is sent together */}
            <form action={action} onSubmit={submit} hidden={typeof screen !== "number"} noValidate>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="customerName" value={v.customerName} />
              <input type="hidden" name="customerPhone" value={v.customerPhone} />
              <input type="hidden" name="location" value={v.location} />
              <input type="hidden" name="product" value={v.product} />
              <input type="hidden" name="rating" value={rating} />
              <input type="hidden" name="feedback" value={collectOnly ? v.feedback : ""} />

              {screen === 1 && (
                <div key="s1" className="tab-fade space-y-3">
                  <div className="pb-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      Tell us about you {detailsMode === "optional" && <span className="text-sm font-medium text-slate-400">(optional)</span>}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">Please enter your contact details.</p>
                  </div>
                  <IconInput Icon={FaUser} value={v.customerName} onChange={set("customerName")} autoComplete="name" placeholder="Full name" aria-label="Full name" autoFocus />
                  <IconInput Icon={FaPhone} value={v.customerPhone} onChange={set("customerPhone")} type="tel" autoComplete="tel" placeholder="Phone number" aria-label="Phone number" />
                  <IconInput Icon={FaLocationDot} value={v.location} onChange={set("location")} autoComplete="address-level2" placeholder="City or area" aria-label="City or area" />
                </div>
              )}

              {screen === 2 && (
                <div key="s2" className="tab-fade space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">What did you buy or try?</h2>
                    <p className="mt-0.5 pb-3 text-sm text-slate-500">A product, a dish, a service… anything.</p>
                    <IconInput Icon={FaBagShopping} value={v.product} onChange={set("product")} placeholder={productHint} aria-label="What did you buy or try?" maxLength={60} autoFocus />
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center ring-1 ring-slate-100">
                    <p className="font-semibold text-slate-800">How was your experience?</p>
                    <div role="radiogroup" aria-label="Star rating" className="mt-3 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}: ${RATING_LABELS[n]}`}
                          onClick={() => { setRating(n); setError(""); }} onMouseEnter={() => setHover(n)}
                          className="rounded-lg p-1 transition active:scale-90 hover:scale-110 focus-visible:outline-2 focus-visible:outline-blue-600">
                          <FaStar className={`size-10 transition ${n <= shownStars ? "text-amber-400 drop-shadow-sm" : "text-slate-200"}`} />
                        </button>
                      ))}
                    </div>
                    <p className={`mt-2 h-5 text-sm font-semibold ${shownStars ? "text-amber-600" : "text-slate-400"}`}>
                      {RATING_LABELS[shownStars] || "Tap to rate"}
                    </p>
                  </div>

                  {collectOnly && (
                    <label className="block">
                      <span className="flex items-baseline justify-between text-sm font-semibold text-slate-800">
                        Tell us more <span className="text-xs font-normal text-slate-400">Optional</span>
                      </span>
                      <textarea value={v.feedback} onChange={set("feedback")} rows={3} maxLength={1000}
                        placeholder="What did you like? What could be better?"
                        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                    </label>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {screen === 2 && !hideDetails && (
                  <button type="button" onClick={() => { setScreen(1); setError(""); }} aria-label="Back"
                    className="grid size-13 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                    <FaArrowLeft className="size-4" />
                  </button>
                )}
                <button className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-(--brand) font-bold text-(--brand-fg) shadow-lg shadow-black/10 transition hover:brightness-110 active:scale-[0.99]">
                  {screen === 1 ? <>Continue <FaArrowRight className="size-3.5" /></> : collectOnly ? <><FaPaperPlane className="size-3.5" /> Send feedback</> : <><FaWandMagicSparkles /> Write my review</>}
                </button>
              </div>
              {screen === 1 && detailsMode === "optional" && (
                <button type="button" onClick={skipDetails} className="mt-3 w-full py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
                  Skip this step
                </button>
              )}
            </form>

            {/* Loader */}
            {screen === "loading" && (
              <div role="status" aria-live="polite" className="tab-fade flex flex-col items-center py-12 text-center">
                <div className="relative grid size-24 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-amber-100 motion-safe:animate-ping [animation-duration:1.6s]" />
                  <span className="absolute inset-2 animate-spin rounded-full border-4 border-slate-100 border-t-blue-900" />
                  <FaWandMagicSparkles className="relative size-7 text-amber-500" />
                </div>
                <p key={line} className="tab-fade mt-7 text-lg font-bold text-slate-900">{loadingLines[line]}</p>
                <p className="mt-1 text-sm text-slate-500">This takes just a moment</p>
              </div>
            )}

            {/* Thank you (collect-only mode) */}
            {screen === "thanks" && (
              <div role="status" className="tab-fade flex flex-col items-center py-6 text-center">
                <div className="relative grid size-24 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-100 motion-safe:animate-ping [animation-duration:2s] [animation-iteration-count:2]" />
                  <span className="relative grid size-20 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <FaCheck className="size-8" />
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-900">Thank you{firstName ? `, ${firstName}` : ""}!</h2>
                <p className="mt-2 max-w-xs leading-relaxed text-slate-500">
                  Your feedback has been sent to <b className="font-semibold text-slate-700">{businessName}</b>. We really appreciate you taking the time.
                </p>
                <div className="mt-4 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => <FaStar key={n} className={`size-5 ${n <= (state?.rating ?? rating) ? "text-amber-400" : "text-slate-200"}`} />)}
                </div>

                {followLinks.length > 0 && (
                  <div className="mt-7 w-full rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700"><FaHeart className="size-3 text-rose-500" /> Stay in touch</p>
                    <div className="mt-3 flex justify-center gap-2">
                      {followLinks.map(({ key, label, Icon, cls }) => (
                        <a key={key} href={socials[key]} target="_blank" rel="noopener noreferrer" aria-label={`Follow on ${label}`} title={label}
                          className={`grid size-11 place-items-center rounded-full text-white transition ${cls}`}>
                          <Icon className="size-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-6 text-xs text-slate-400">You can close this page now.</p>
              </div>
            )}

            {/* Review */}
            {screen === "review" && reviews.length > 0 && (
              <div className="tab-fade space-y-4">
                <div className="text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600"><FaCheck className="size-5" /></span>
                  <h2 className="mt-3 text-xl font-bold text-slate-900">Your review is ready</h2>
                  <div className="mt-1.5 flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => <FaStar key={n} className={`size-4 ${n <= (state?.rating ?? rating) ? "text-amber-400" : "text-slate-200"}`} />)}
                  </div>
                </div>

                <label className="block">
                  <span className="sr-only">Your review</span>
                  <textarea key={choice} value={text} onChange={(e) => { setText(e.target.value); setCopied(false); }} rows={5}
                    className="tab-fade w-full resize-none rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-4 text-base leading-relaxed text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white" />
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><FaPenToSquare /> Tap to edit and make it yours</span>
                </label>

                {reviews.length > 1 && (
                  <button type="button" onClick={() => { const n = (choice + 1) % reviews.length; setChoice(n); setText(reviews[n]); setCopied(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <FaRotate className="size-3" /> Try another version <span className="text-slate-400">({choice + 1} of {reviews.length})</span>
                  </button>
                )}

                <button type="button" onClick={copyAndOpen} disabled={!text.trim()}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-(--brand) font-bold text-(--brand-fg) shadow-lg shadow-black/10 transition hover:brightness-110 disabled:opacity-50">
                  {copied ? <><FaCheck /> Copied! Opening Google…</> : <><FaCopy /> Copy & open Google</>}
                </button>

                {copied && (
                  <div role="status" className="tab-fade rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
                    <p className="flex items-center gap-2 font-semibold"><FaGoogle /> Almost done on Google:</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      <li>Tap <b>{state?.rating} star{state?.rating === 1 ? "" : "s"}</b></li>
                      <li>Long-press the text box and choose <b>Paste</b></li>
                      <li>Tap <b>Post</b></li>
                    </ol>
                    <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-emerald-800 underline underline-offset-2">
                      Google didn’t open? Tap here <FaArrowUpRightFromSquare className="size-3" />
                    </a>
                  </div>
                )}

                <button type="button" onClick={() => setScreen(2)} className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-slate-500 hover:text-slate-800">
                  <FaArrowLeft className="size-3" /> Change my rating
                </button>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Free plan badge: paid plans have none */}
      {branded && (
        <>
          <div className="h-20" aria-hidden />
          <a href="/?ref=review-badge" target="_blank" rel="noopener"
            className="badge-float fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-blue-950 py-2 pl-2 pr-4 text-white shadow-xl shadow-blue-950/30 ring-1 ring-white/10 transition hover:bg-blue-900 sm:left-auto sm:right-5 sm:translate-x-0">
            <span className="grid size-8 place-items-center rounded-full bg-amber-300 text-blue-950"><MdQrCode2 className="size-5" /></span>
            <span className="leading-tight">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-blue-200">Powered by Give Me Five Star</span>
              <span className="block text-xs font-bold">Get your own review page <span aria-hidden>→</span></span>
            </span>
          </a>
        </>
      )}
    </div>
  );
}
