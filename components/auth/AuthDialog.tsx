"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FaXmark, FaStar, FaEye, FaEyeSlash, FaQrcode, FaWandMagicSparkles, FaChartLine, FaCircleExclamation, FaSpinner, FaEnvelopeOpenText, FaCircleCheck, FaArrowLeft, FaRotateRight } from "react-icons/fa6";
import { login, resendCode, signup as signupAction, verifyEmail, type AuthState } from "@/app/actions/auth";
import { site } from "@/lib/site";

export type AuthMode = "login" | "signup";

// Open from anywhere: openAuth("signup")
export const openAuth = (mode: AuthMode = "signup") =>
  window.dispatchEvent(new CustomEvent<AuthMode>("auth:open", { detail: mode }));

const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({ autoComplete, minLength }: { autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name="password" type={show ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete} placeholder="••••••••" className={`${input} pr-12`} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-slate-600">
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

// Step 2 after sign-up (or logging in unverified): the 6-digit code from the email
function VerifyStep({ email, firstError, onBack }: { email: string; firstError?: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(verifyEmail, undefined);
  const [wait, setWait] = useState(60);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(firstError ? { ok: false, text: firstError } : null);
  const error = state?.error;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setWait(60);
    const r = await resendCode(email);
    setNote(r.error ? { ok: false, text: r.error } : { ok: true, text: "A new code is on its way." });
  }

  return (
    <form action={action} className="tab-fade space-y-5">
      <div className="flex items-start gap-4 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-900 text-amber-300"><FaEnvelopeOpenText className="size-5" /></span>
        <p className="text-sm leading-relaxed text-slate-600">
          We sent a 6-digit code to <strong className="break-all text-slate-900">{email}</strong>. It expires in 10 minutes. Check your spam folder if you can&apos;t see it.
        </p>
      </div>
      {(error || note) && (
        <p role="alert" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${error || !note?.ok ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {error || !note?.ok ? <FaCircleExclamation className="mt-0.5 shrink-0" /> : <FaCircleCheck className="mt-0.5 shrink-0" />} {error ?? note?.text}
        </p>
      )}
      <input type="hidden" name="email" value={email} />
      <Field label="Verification code">
        <input name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" placeholder="000000"
          // strip spaces/dashes before trimming, so a pasted "482 913" still fits
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 6); }}
          className={`${input} text-center font-mono text-2xl font-bold tracking-[0.5em] placeholder:tracking-[0.5em]`} />
      </Field>
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 active:scale-[0.99] disabled:opacity-70">
        {pending && <FaSpinner className="animate-spin" />}
        {pending ? "Checking…" : "Verify and continue"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800"><FaArrowLeft className="size-3" /> Change email</button>
        <button type="button" onClick={resend} disabled={wait > 0} className="flex items-center gap-1.5 font-semibold text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline">
          <FaRotateRight className="size-3" /> {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

// One form per mode; the server action validates, creates the session and redirects to /dashboard
function AuthForm({ signup }: { signup: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup ? signupAction : login, undefined);
  const [leftState, setLeftState] = useState<AuthState>(); // "Change email" returns to the form, keeping what was typed
  const f = state?.fields ?? {};

  if (state?.verify && state !== leftState) return <VerifyStep email={state.verify} firstError={state.error} onBack={() => setLeftState(state)} />;

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p role="alert" className="tab-fade flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <FaCircleExclamation className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      {signup && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input name="name" defaultValue={f.name} required minLength={2} autoComplete="name" placeholder="Ram Sharma" className={input} /></Field>
          <Field label="Business name"><input name="businessName" defaultValue={f.businessName} required minLength={2} autoComplete="organization" placeholder="Himalayan Café" className={input} /></Field>
        </div>
      )}
      <Field label="Email"><input name="email" type="email" defaultValue={f.email} required autoComplete="email" placeholder="you@business.com" className={input} /></Field>
      <Field label="Password"><PasswordInput autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : undefined} /></Field>

      {!signup && (
        <div className="text-right">
          {/* no email service yet, so password resets go through support */}
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-700 hover:underline">Forgot password?</a>
        </div>
      )}

      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 active:scale-[0.99] disabled:opacity-70">
        {pending && <FaSpinner className="animate-spin" />}
        {pending ? (signup ? "Creating account…" : "Logging in…") : signup ? "Create free account" : "Log in"}
      </button>
    </form>
  );
}

export default function AuthDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<AuthMode>("signup");

  useEffect(() => {
    const onOpen = (e: Event) => {
      setMode((e as CustomEvent<AuthMode>).detail);
      ref.current?.showModal();
    };
    window.addEventListener("auth:open", onOpen);
    // e.g. /?auth=login after being sent away from the dashboard
    const fromUrl = new URLSearchParams(location.search).get("auth");
    if (fromUrl === "login" || fromUrl === "signup") { setMode(fromUrl); ref.current?.showModal(); }
    return () => window.removeEventListener("auth:open", onOpen);
  }, []);

  const signup = mode === "signup";

  return (
    <dialog
      ref={ref}
      // click on the backdrop closes
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="auth-dialog m-auto w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="grid md:grid-cols-[5fr_6fr]">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-blue-950 p-10 text-white md:flex">

          <div className="relative">
            <p className="text-sm font-extrabold tracking-[0.15em]">GIVE ME FIVE STAR</p>
            <h2 className="mt-8 text-3xl font-bold leading-tight">
              Turn happy customers into <span className="text-amber-300">5<FaStar className="inline size-6 -translate-y-0.5" /> Google reviews</span>.
            </h2>
            <ul className="mt-8 space-y-4 text-blue-100">
              {[
                { Icon: FaQrcode, text: "One link & QR code for your business" },
                { Icon: FaWandMagicSparkles, text: "AI writes the review for your customer" },
                { Icon: FaChartLine, text: "Track every review request" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-white/10"><Icon /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative mt-10 rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="flex gap-1 text-amber-300">{Array.from({ length: 5 }, (_, i) => <FaStar key={i} />)}</div>
            <blockquote className="mt-3 text-sm leading-relaxed text-blue-50">
              “Our Google reviews doubled in the first month. Customers love how easy it is.”
            </blockquote>
            <figcaption className="mt-3 text-xs text-blue-200">— Café owner</figcaption>
          </figure>
        </aside>

        {/* Form panel */}
        <section className="relative p-8 sm:p-10">
          <button onClick={() => ref.current?.close()} aria-label="Close" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <FaXmark className="size-5" />
          </button>

          <h3 className="text-2xl font-bold text-slate-900">{signup ? "Create your account" : "Welcome back"}</h3>
          <p className="mt-1 text-sm text-slate-500">{signup ? "Start collecting reviews in 2 minutes. No card needed." : "Log in to manage your review links."}</p>

          {/* Tabs */}
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg py-2 transition ${mode === m ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {/* key gives each mode a fresh form state */}
            <AuthForm key={mode} signup={signup} />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {signup ? "Already have an account? " : "New to Give Me Five Star? "}
            <button type="button" onClick={() => setMode(signup ? "login" : "signup")} className="font-semibold text-blue-700 hover:underline">
              {signup ? "Log in" : "Create one free"}
            </button>
          </p>
        </section>
      </div>
    </dialog>
  );
}
