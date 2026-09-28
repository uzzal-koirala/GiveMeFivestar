"use client";

import { useActionState, useRef, useEffect } from "react";
import { FaWhatsapp, FaPhone, FaEnvelope, FaClock, FaPaperPlane, FaCircleCheck, FaCircleExclamation, FaSpinner, FaLocationDot } from "react-icons/fa6";
import { sendContact, type ContactState } from "@/app/actions/contact";
import { CONTACT_TOPICS } from "@/lib/site";
import type { SupportContact } from "@/lib/platform";

const field = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const label = "mb-1.5 block text-sm font-semibold text-slate-800";

export default function ContactSection({ support }: { support: SupportContact }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, undefined);
  const form = useRef<HTMLFormElement>(null);
  const f = state?.fields ?? {};
  useEffect(() => { if (state?.sent) form.current?.reset(); }, [state]);

  const ways = [
    support.whatsapp && { href: support.whatsapp, Icon: FaWhatsapp, tint: "bg-emerald-500/15 text-emerald-300", title: "WhatsApp", text: "Fastest reply" },
    support.phone && { href: `tel:${support.phone}`, Icon: FaPhone, tint: "bg-white/10 text-amber-300", title: support.phone, text: "Call us" },
    support.email && { href: `mailto:${support.email}`, Icon: FaEnvelope, tint: "bg-white/10 text-amber-300", title: support.email, text: "Email us" },
  ].filter(Boolean) as { href: string; Icon: typeof FaPhone; tint: string; title: string; text: string }[];

  return (
    <section id="contact" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* ways to reach us */}
        <div className="flex flex-col rounded-3xl bg-blue-950 p-6 text-white sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Contact</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Let&apos;s talk</h2>
          <p className="mt-3 text-blue-100/85">Questions about plans, setup or QR stands? Send us a message and we&apos;ll get back to you within a few hours.</p>
          <ul className="mt-8 space-y-3">
            {ways.map(({ href, Icon, tint, title, text }) => (
              <li key={text}>
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tint}`}><Icon className="size-4.5" /></span>
                  <span className="min-w-0"><span className="block truncate font-semibold">{title}</span><span className="block text-xs text-blue-200">{text}</span></span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-2 pt-8 text-sm text-blue-100/80">
            {support.hours && <p className="flex items-center gap-2"><FaClock className="size-3.5 text-amber-300" /> {support.hours.replace(/^\(|\)$/g, "")}</p>}
            <p className="flex items-center gap-2"><FaLocationDot className="size-3.5 text-amber-300" /> Kathmandu, Nepal</p>
          </div>
        </div>

        {/* form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {state?.sent ? (
            <div className="grid h-full place-items-center py-10 text-center">
              <div>
                <span className="pop-in mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50"><FaCircleCheck className="size-8" /></span>
                <h3 className="mt-6 text-2xl font-extrabold text-slate-900">Message sent!</h3>
                <p className="mx-auto mt-2 max-w-sm text-slate-500">Thanks for reaching out. Our team will contact you within a few hours during working hours.</p>
              </div>
            </div>
          ) : (
            <form key={state?.error ? JSON.stringify(f) : "form"} ref={form} action={action} className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Send us a message</h3>
                <p className="mt-1 text-sm text-slate-500">We usually reply the same day.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label><span className={label}>Your name</span><input name="name" defaultValue={f.name} required minLength={2} autoComplete="name" placeholder="e.g. Sita Sharma" className={field} /></label>
                <label><span className={label}>Phone number</span><input name="phone" defaultValue={f.phone} type="tel" required autoComplete="tel" placeholder="+977-98XXXXXXXX" className={field} /></label>
                <label><span className={label}>Email <span className="font-normal text-slate-400">(optional)</span></span><input name="email" defaultValue={f.email} type="email" autoComplete="email" placeholder="you@business.com" className={field} /></label>
                <label><span className={label}>Business name <span className="font-normal text-slate-400">(optional)</span></span><input name="business" defaultValue={f.business} autoComplete="organization" placeholder="e.g. Himalayan Java Café" className={field} /></label>
                <label><span className={label}>City</span><input name="city" defaultValue={f.city} autoComplete="address-level2" placeholder="e.g. London" className={field} /></label>
                <label><span className={label}>Topic</span>
                  <select name="topic" required defaultValue={f.topic ?? ""} className={field}>
                    <option value="" disabled>Choose a topic</option>
                    {CONTACT_TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <label className="block"><span className={label}>Message</span>
                <textarea name="message" defaultValue={f.message} required minLength={10} maxLength={2000} rows={5} placeholder="How can we help?" className={`${field} resize-y leading-relaxed`} />
              </label>
              {/* bots fill this in; people never see it */}
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              {state?.error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"><FaCircleExclamation className="shrink-0" /> {state.error}</p>}
              <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto sm:px-8">
                {pending ? <><FaSpinner className="animate-spin" /> Sending…</> : <><FaPaperPlane className="size-3.5" /> Send message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
