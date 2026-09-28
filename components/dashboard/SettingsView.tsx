"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaQrcode, FaHashtag,
  FaUser, FaStore, FaWandMagicSparkles, FaLock, FaCheck, FaArrowUpRightFromSquare, FaEye, FaEyeSlash, FaTriangleExclamation, FaCrown, FaKey, FaSpinner,
  FaStar, FaCircleInfo, FaEnvelope, FaPhone, FaLocationDot, FaLanguage, FaPenNib,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import TagInput from "@/components/ui/TagInput";
import { TONES } from "@/lib/tones";
import PhotoUpload from "@/components/ui/PhotoUpload";
import CreditsCard from "@/components/dashboard/CreditsCard";
import ReviewPageCard, { type ReviewPageCardHandle, type ReviewPageSettings } from "@/components/dashboard/ReviewPageCard";
import ReviewDesignCard, { type ReviewDesign } from "@/components/dashboard/ReviewDesignCard";
import InstructionsDialog from "@/components/dashboard/InstructionsDialog";
import StandOrderPanel from "@/components/dashboard/StandOrderPanel";
import type { StandOrderView } from "@/app/actions/stands";
import { canDesignPage } from "@/lib/site";
import SubscriptionPanel from "@/components/dashboard/SubscriptionPanel";
import { plans } from "@/lib/site";
import { saveSecurity, saveSettings, type SettingsInput } from "@/app/actions/settings";
import type { PaymentRequestView } from "@/lib/types";
import type { PaymentMethod } from "@/lib/platform";

const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

const TABS = [
  { id: "business", label: "Business", Icon: FaStore },
  { id: "ai", label: "AI Reviews", Icon: FaWandMagicSparkles },
  { id: "subscription", label: "Subscription", Icon: FaCrown },
  { id: "stand", label: "QR Stand", Icon: FaQrcode },
  { id: "security", label: "Security", Icon: FaLock },
] as const;
type Tab = (typeof TABS)[number]["id"];

const LANGS = [
  { id: "en", label: "English" },
  { id: "ne", label: "नेपाली" },
  { id: "mix", label: "Mixed" },
];
const MAX_INSTRUCTIONS = 2000;
const PLACEHOLDER = `Tell the AI about your business, for example:

- What you do and who your customers are
- What makes you different (quality, service, experience, location)
- What customers usually praise you for
- Things to mention or avoid (e.g. don't mention prices)
- Preferred length and style (e.g. short and casual, like a real customer)`;

const NE_SAMPLE = "{p} एकदमै मिठो थियो र सेवा पनि राम्रो। फेरि आउनेछु!";
const MIX_SAMPLE = "{p} ekdam mitho thiyo! Staff pani dherai friendly. Highly recommend!";

export type Account = { ownerName: string; email: string; phone: string; businessName: string; avatarUrl: string | null; plan: string; planExpiresAt: string | null; credits: number; bonusCredits: number };
export type Business = {
  location: string; googleReviewUrl: string; linkedOn: string; products: string[]; description: string;
  tone: string; language: string; aiInstructions: string; keywords: string[];
};

const toForm = (a: Account, b: Business | null) => ({
  photo: a.avatarUrl ?? "", // URL of the saved photo, or a new data URL after picking one
  ownerName: a.ownerName, email: a.email, phone: a.phone, businessName: a.businessName,
  location: b?.location ?? "", products: b?.products ?? [], description: b?.description ?? "",
  tone: b?.tone ?? "friendly", language: b?.language ?? "en", aiInstructions: b?.aiInstructions ?? "",
  keywords: b?.keywords ?? [],
});
type Form = ReturnType<typeof toForm>;

function Field({ label, hint, Icon, children }: { label: string; hint?: string; Icon?: IconType; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {Icon && <Icon className="size-3.5 text-slate-400" />} {label}
      </span>
      {children}
      {hint && <span className="mt-2 flex items-start gap-1.5 text-xs text-slate-500"><FaCircleInfo className="mt-px size-3 shrink-0" />{hint}</span>}
    </label>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

const LEVELS = [
  { label: "Too weak", color: "bg-rose-500" },
  { label: "Weak", color: "bg-rose-500" },
  { label: "Fair", color: "bg-amber-400" },
  { label: "Good", color: "bg-blue-600" },
  { label: "Strong", color: "bg-emerald-500" },
];

function strength(pw: string) {
  const score = [pw.length >= 8, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  return { score, ...LEVELS[score] };
}

export default function SettingsView({ account, business, reviewPage, payments, usedThisMonth, methods, design, standOrders }: {
  design: ReviewDesign | null;
  standOrders: StandOrderView[];
  account: Account;
  business: Business | null;
  reviewPage: ReviewPageSettings | null;
  payments: PaymentRequestView[];
  usedThisMonth: number;
  methods: PaymentMethod[];
}) {
  const [tab, setTab] = useState<Tab>("business");
  const [saveError, setSaveError] = useState("");
  const [instrOpen, setInstrOpen] = useState(false);

  // the tab follows the URL (e.g. ?tab=subscription), so links from the side menu work while already on this page
  const urlTab = useSearchParams().get("tab");
  useEffect(() => {
    if (TABS.some((x) => x.id === urlTab)) setTab(urlTab as Tab);
  }, [urlTab]);
  const pickTab = (id: Tab) => { setTab(id); history.replaceState(null, "", `?tab=${id}`); };
  const [saved, setSaved] = useState<Form>(() => toForm(account, business));
  const [form, setForm] = useState<Form>(saved);
  const EMPTY_PW = { current: "", next: "", confirm: "" };
  const [pw, setPw] = useState(EMPTY_PW);
  const [pwError, setPwError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState(false);
  const card = useRef<ReviewPageCardHandle>(null);
  const [cardDirty, setCardDirty] = useState(false);
  const onCardDirty = useCallback((d: boolean) => setCardDirty(d), []);
  const [saving, setSaving] = useState(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const pendingLeave = useRef<(() => void) | null>(null);
  const router = useRouter();

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaveError(""); };
  const formDirty = JSON.stringify(form) !== JSON.stringify(saved) || !!pw.next;
  const dirty = formDirty || cardDirty;
  const pwMismatch = !!pw.confirm && pw.next !== pw.confirm;
  const pwStrength = strength(pw.next);
  const initials = form.ownerName.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const tone = TONES.find((t) => t.id === form.tone)!;
  const sample = (form.language === "ne" ? NE_SAMPLE : form.language === "mix" ? MIX_SAMPLE : tone.sample).replace("{p}", form.products[0] ?? "food");

  // Saves everything that changed. Returns false (and shows where) if something needs fixing.
  async function saveAll(): Promise<boolean> {
    // only the open tab's inputs are mounted, so check required fields on the others here
    if (!form.ownerName.trim() || !form.businessName.trim()) { setSaveError("Enter your name and business name."); setTab("business"); return false; }
    if (!form.email.trim()) { setTab("security"); return false; }
    if (pw.next && !pw.current) { setPwError("Enter your current password to set a new one."); setTab("security"); return false; }
    if (pw.next && pw.next === pw.current) { setPwError("New password must be different from your current one."); setTab("security"); return false; }
    if (pwMismatch) { setTab("security"); return false; }

    const { email, photo, ...rest } = form;
    const { email: _email, photo: savedPhoto, ...savedRest } = saved;
    const profileChanged = photo !== savedPhoto || JSON.stringify(rest) !== JSON.stringify(savedRest);
    const securityChanged = email.trim().toLowerCase() !== saved.email || !!pw.next;

    setSaving(true);
    try {
      if (profileChanged) {
        const res = await saveSettings({ ...rest, language: rest.language as SettingsInput["language"], photo: photo === savedPhoto ? "keep" : photo });
        if (res.error) { setSaveError(res.error); setTab("business"); return false; }
        if (res.avatarUrl !== undefined) form.photo = res.avatarUrl ?? "";
      }
      if (securityChanged) {
        const res = await saveSecurity({ email, currentPassword: pw.current, newPassword: pw.next });
        if (res.error) { setPwError(res.error); setTab("security"); return false; }
        form.email = email.trim().toLowerCase();
      }
      const cardOk = cardDirty ? (await card.current?.save()) ?? true : true; // review page card
      if (!cardOk) { setTab("business"); return false; }
    } finally {
      setSaving(false);
    }

    setPwError("");
    setSaveError("");
    setForm({ ...form });
    setSaved({ ...form });
    setPw(EMPTY_PW);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
    return true;
  }

  function discardAll() {
    setSaveError("");
    setForm(saved);
    setPw(EMPTY_PW);
    setPwError("");
    card.current?.discard();
  }

  // Run `go` now, or ask first when there are unsaved changes
  function guard(go: () => void) {
    if (!dirty) return go();
    pendingLeave.current = go;
    leaveDialog.current?.showModal();
  }

  async function leave(choice: "save" | "discard") {
    if (choice === "save" && !(await saveAll())) return leaveDialog.current?.close(); // stay to fix the problem
    if (choice === "discard") discardAll();
    leaveDialog.current?.close();
    pendingLeave.current?.();
    pendingLeave.current = null;
  }

  // leaving the page: other dashboard links, and closing/reloading the browser tab
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      e.stopPropagation(); // stop Next's <Link> from navigating
      guard(() => router.push(url.pathname + url.search));
    };
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("beforeunload", onUnload); };
  });

  return (
    // a <div>, not a <form>: the payment popups inside have their own forms and forms can't nest
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-blue-200">Manage your business, plan and how AI writes reviews.</p>
      </div>

      {/* Profile summary card */}
      <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {form.photo ? (
          <img src={form.photo} alt="" className="size-16 rounded-2xl object-cover shadow-lg shadow-blue-900/20" />
        ) : (
          <span className="grid size-16 place-items-center rounded-2xl bg-blue-950 text-xl font-bold text-white shadow-lg shadow-blue-900/20">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-slate-900">{form.ownerName || "Your name"}</p>
          <p className="truncate text-sm text-slate-500">{form.businessName} · {form.email}</p>
        </div>
        <button type="button" onClick={() => guard(() => setTab("subscription"))} title="View subscription"
          className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200">
          <FaCrown className="size-3" /> {plans.find((p) => p.id === account.plan)?.name ?? "Free"} plan
        </button>
      </div>

      {saveError && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <FaTriangleExclamation className="shrink-0" /> {saveError}
        </p>
      )}

      {/* Tabs */}
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl sm:flex border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => tab !== id && guard(() => pickTab(id))}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 last:col-span-2 sm:px-4 text-sm font-semibold transition ${tab === id ? "bg-blue-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      <div key={tab} className="tab-fade">
        {tab === "business" && (
          <div className="space-y-6">
          <Section title="Personal details" desc="This is how we contact you. Customers never see it.">
            <PhotoUpload value={form.photo} onChange={(v) => set("photo", v)} initials={initials} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" Icon={FaUser}>
                <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} required autoComplete="name" className={input} />
              </Field>
              <Field label="Phone" Icon={FaPhone}>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" className={input} />
              </Field>
            </div>
          </Section>

          <Section title="Your business" desc="Shown to customers and used by AI to write accurate reviews.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Business name" Icon={FaStore}>
                <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required className={input} />
              </Field>
              {business && (
                <Field label="Location" Icon={FaLocationDot}>
                  <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Downtown, your city" className={input} />
                </Field>
              )}
            </div>
            {!business ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                Finish your business setup (the banner at the top) to add your Google link, products and description.
              </p>
            ) : (
            <>
            {/* Locked once set: only the super admin can change it */}
              <div>
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FaStar className="size-3.5 text-slate-400" /> Google review link
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"><FaLock className="size-2.5" /> Locked</span>
                </span>
                <div className="flex gap-2">
                  <p className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500">
                    <FaLock className="size-3.5 shrink-0" /> <span className="truncate">{business.googleReviewUrl}</span>
                  </p>
                  <a href={business.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <FaArrowUpRightFromSquare className="size-3" /> Test
                  </a>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <FaCircleInfo className="size-3" /> To keep your reviews safe, this link can’t be changed here.
                  <a href="/dashboard/support?new=google-link" className="font-semibold text-blue-700 hover:underline">
                    Contact admin to change it
                  </a>
                </p>
              </div>
            <Field label="Products & services" hint="Shown to customers as examples. Press Enter to add, click × to remove.">
              <TagInput value={form.products} onChange={(v) => set("products", v)} placeholder="Type a product and press Enter" />
            </Field>
            <Field label="About your business" Icon={FaStore} hint="Shown on your review page and used by AI to write accurate reviews.">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={1000}
                placeholder="What you offer, what makes you special, what customers love." className={`${input} resize-y leading-relaxed`} />
            </Field>
            </>
            )}
          </Section>
          </div>
        )}

        {tab === "ai" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <CreditsCard credits={account.credits} bonus={account.bonusCredits} plan={account.plan} usedThisMonth={usedThisMonth} payments={payments} methods={methods} />

            <Section title="Review style" desc="Choose how AI-written reviews should sound.">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800">Tone</p>
                <div role="radiogroup" aria-label="Tone" className="grid gap-3 sm:grid-cols-3">
                  {TONES.map(({ id, label, desc, Icon }) => {
                    const on = form.tone === id;
                    return (
                      <button key={id} type="button" role="radio" aria-checked={on} onClick={() => set("tone", id)}
                        className={`relative rounded-2xl border-2 p-4 text-left transition ${on ? "border-blue-900 bg-blue-50/60" : "border-slate-200 hover:border-slate-300"}`}>
                        {on && <FaCheck className="absolute right-3 top-3 size-3 text-blue-900" />}
                        <span className={`grid size-10 place-items-center rounded-xl ${on ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-500"}`}><Icon /></span>
                        <p className="mt-3 font-semibold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><FaLanguage className="size-4 text-slate-400" /> Language</p>
                <div role="radiogroup" aria-label="Language" className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1.5">
                  {LANGS.map(({ id, label }) => (
                    <button key={id} type="button" role="radio" aria-checked={form.language === id} onClick={() => set("language", id)}
                      className={`rounded-xl py-2.5 text-sm font-semibold transition ${form.language === id ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Live preview */}
            <aside className="relative overflow-hidden rounded-3xl bg-blue-950 p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
              <p className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
                <FaWandMagicSparkles /> Live preview
              </p>
              <div className="relative mt-5 rounded-2xl bg-white p-5 text-slate-700 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">SG</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sita Gurung</p>
                    <div className="flex gap-0.5 text-amber-400">{Array.from({ length: 5 }, (_, i) => <FaStar key={i} className="size-3" />)}</div>
                  </div>
                </div>
                <p key={sample} className="tab-fade mt-4 text-sm leading-relaxed">{sample}</p>
              </div>
              <p className="relative mt-4 text-xs text-blue-200">Example only. Every customer gets a unique review based on what they bought.</p>
              {form.aiInstructions.trim() && (
                <p className="relative mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-amber-200">
                  <FaPenNib /> Your custom instructions will be applied
                </p>
              )}
              {form.keywords.length > 0 && (
                <div className="relative mt-3 rounded-xl bg-white/10 px-3 py-2.5">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-200"><FaHashtag /> Keywords the AI will work in</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.keywords.map((k) => <span key={k} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">{k}</span>)}
                  </div>
                </div>
              )}
            </aside>

            {/* Custom instructions */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><FaPenNib /></span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Custom instructions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Teach the AI about your business and the reviews you want. The more detail, the better and more personal the reviews.
                  </p>
                </div>
              </div>

              {form.aiInstructions.trim() ? (
                <button type="button" onClick={() => setInstrOpen(true)} aria-label="View custom instructions"
                  className="group mt-6 block w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40">
                  <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{form.aiInstructions}</p>
                  <span className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-800 group-hover:underline">View full instructions</span>
                    <span className="text-slate-400">{form.aiInstructions.length} / {MAX_INSTRUCTIONS} characters</span>
                  </span>
                </button>
              ) : (
                <button type="button" onClick={() => setInstrOpen(true)}
                  className="mt-6 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-left transition hover:border-blue-400 hover:bg-blue-50/40">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><FaPenNib /></span>
                  <span>
                    <span className="block font-semibold text-slate-800">No instructions yet</span>
                    <span className="block text-sm text-slate-500">Tell the AI what to mention, what to avoid and how reviews should sound.</span>
                  </span>
                </button>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><FaCircleInfo className="size-3" /> Customers never see these instructions.</span>
                <button type="button" onClick={() => setInstrOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
                  <FaPenNib className="size-3" /> {form.aiInstructions.trim() ? "View & edit" : "Write instructions"}
                </button>
              </div>
              <InstructionsDialog open={instrOpen} onClose={() => setInstrOpen(false)} value={form.aiInstructions} onChange={(v) => set("aiInstructions", v)}
                max={MAX_INSTRUCTIONS} placeholder={PLACEHOLDER}
                known={{
                  description: form.description, products: form.products, keywords: form.keywords,
                  tone: TONES.find((t) => t.id === form.tone)?.label ?? form.tone, language: LANGS.find((l) => l.id === form.language)?.label ?? form.language,
                }} />
            </section>

            {/* Keywords */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-800"><FaHashtag /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-900">Keywords to include</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Words you want people to find you by on Google, like your area or best seller. The AI works one into each review, a different one each time, and only where it sounds natural.
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${form.keywords.length >= 10 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{form.keywords.length} / 10</span>
              </div>
              <div className="mt-6">
                <TagInput value={form.keywords} onChange={(v) => set("keywords", v.slice(0, 10))} placeholder="e.g. best momo in Itahari, family restaurant (press Enter)" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400">Ideas:</span>
                {[`best ${form.products[0]?.toLowerCase() ?? "food"}`, form.location ? `${form.location.split(",")[0]}` : "near me", "friendly staff", "good value"]
                  .filter((k) => !form.keywords.includes(k))
                  .map((k) => (
                    <button key={k} type="button" disabled={form.keywords.length >= 10} onClick={() => set("keywords", [...form.keywords, k])}
                      className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-40">
                      + {k}
                    </button>
                  ))}
              </div>
              <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
                <FaCircleInfo className="mt-0.5 size-3 shrink-0" /> A few good keywords work better than many. Reviews stuffed with keywords look fake, so the AI never forces them.
              </p>
            </section>
          </div>
        )}

        {tab === "subscription" && <SubscriptionPanel plan={account.plan} expiresAt={account.planExpiresAt} payments={payments} methods={methods} credits={account.credits} bonus={account.bonusCredits} usedThisMonth={usedThisMonth} />}

        {tab === "stand" && <StandOrderPanel orders={standOrders} methods={methods} businessName={account.businessName} />}

        {tab === "security" && (
          <div className="space-y-6">
          <Section title="Login email" desc="Used to sign in and to receive receipts and important alerts.">
            <Field label="Email" Icon={FaEnvelope}>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" className={input} />
            </Field>
          </Section>

          <Section title="Change password" desc="Use at least 8 characters with a mix of letters, numbers and symbols.">
            <Field label="Current password" Icon={FaKey}>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={pw.current} onChange={(e) => { setPw({ ...pw, current: e.target.value }); setPwError(""); }}
                  required={!!pw.next} autoComplete="current-password" placeholder="Enter your current password" className={`${input} pr-12`} />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide passwords" : "Show passwords"} className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-slate-600">
                  {showPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="New password" Icon={FaLock}>
                <input type={showPw ? "text" : "password"} value={pw.next} onChange={(e) => { setPw({ ...pw, next: e.target.value }); setPwError(""); }} minLength={8} autoComplete="new-password" className={input} />
              </Field>
              <Field label="Confirm password" Icon={FaLock}>
                <input type={showPw ? "text" : "password"} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required={!!pw.next} autoComplete="new-password"
                  className={`${input} ${pwMismatch ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""}`} />
                {pwMismatch && <span className="mt-2 block text-xs font-medium text-rose-600">Passwords don’t match</span>}
              </Field>
            </div>
            {pw.next && (
              <div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= pwStrength.score ? pwStrength.color : "bg-slate-200"}`} />)}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600">Strength: {pwStrength.label}</p>
              </div>
            )}
            {pwError && <p role="alert" className="flex items-center gap-2 text-sm font-medium text-rose-600"><FaTriangleExclamation className="size-3.5" /> {pwError}</p>}
          </Section>
          </div>
        )}
      </div>

      {/* Always mounted (only hidden on other tabs) so its unsaved edits and saved values survive tab switches */}
      <div hidden={tab !== "business"}>
        <ReviewPageCard ref={card} initial={reviewPage} onDirtyChange={onCardDirty} />
        {design && (
          <div className="mt-6">
            <ReviewDesignCard initial={design} allowed={canDesignPage(account.plan)} businessName={account.businessName} logoUrl={account.avatarUrl} />
          </div>
        )}
      </div>

      {/* Save bar: appears only with unsaved changes */}
      <div className={`fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 transition duration-300 ${dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
        <div className="flex items-center gap-4 rounded-2xl bg-slate-900 py-2.5 pl-5 pr-2.5 text-white shadow-2xl">
          <span className="text-sm">You have unsaved changes</span>
          <button type="button" onClick={discardAll} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
            Discard
          </button>
          <button type="button" onClick={saveAll} disabled={saving} className="flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-2 text-sm font-bold text-blue-950 hover:bg-amber-200 disabled:opacity-70">
            {saving ? <><FaSpinner className="animate-spin" /> Saving…</> : "Save changes"}
          </button>
        </div>
      </div>

      {/* Unsaved changes: confirm before switching tab or leaving */}
      <dialog ref={leaveDialog} onClick={(e) => e.target === e.currentTarget && leaveDialog.current?.close()}
        className="auth-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
        <div className="p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-600"><FaTriangleExclamation className="size-5" /></span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Save your changes?</h2>
          <p className="mt-1 text-sm text-slate-500">You have unsaved changes. Save them before leaving, or discard them.</p>
          <div className="mt-6 grid gap-2">
            <button type="button" onClick={() => leave("save")} disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-70">
              {saving ? <><FaSpinner className="animate-spin" /> Saving…</> : "Save changes"}
            </button>
            <button type="button" onClick={() => leave("discard")} className="rounded-xl border border-rose-200 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
              Discard changes
            </button>
            <button type="button" onClick={() => leaveDialog.current?.close()} className="py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
              Keep editing
            </button>
          </div>
        </div>
      </dialog>

      {/* Saved toast */}
      <div role="status" className={`fixed inset-x-0 bottom-6 z-30 flex justify-center transition duration-300 ${toast ? "opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
        <span className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          <FaCheck /> Settings saved
        </span>
      </div>
    </div>
  );
}
