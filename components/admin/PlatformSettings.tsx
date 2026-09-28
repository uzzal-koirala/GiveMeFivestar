"use client";

import { useEffect, useState, useTransition } from "react";
import type { IconType } from "react-icons";
import {
  FaCheck, FaCircleExclamation, FaPlus, FaTrashCan, FaCloudArrowUp, FaWallet, FaBuildingColumns, FaRobot, FaBullhorn, FaUserPlus,
  FaHeadset, FaBell, FaEye, FaEyeSlash, FaPlug, FaKey, FaArrowUpRightFromSquare, FaCircleInfo, FaTriangleExclamation, FaCircleCheck,
} from "react-icons/fa6";
import { saveAiSettings, savePaymentMethods, savePlatformSection, testAiConnection } from "@/app/actions/admin";
import type { Announcement, PaymentMethod, SupportContact } from "@/lib/platform";
import { isBank } from "@/lib/site";

type Msg = { ok: boolean; text: string } | null;
export type AiView = { enabled: boolean; model: string; temperature: number; keyHint: string; keyFromEnv: boolean };
type Props = {
  ai: AiView; adPrice: number; adMin: number; adMax: number; signupCredits: number; signupsOpen: boolean;
  support: SupportContact; announcement: Announcement; methods: PaymentMethod[];
};

const field = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const small = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";
const saveBtn = "flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50";
const QR_MAX_KB = 800;
const MODELS = ["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3.5-haiku", "google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct"];

const NAV: { id: string; label: string; Icon: IconType }[] = [
  { id: "ai", label: "AI & OpenRouter", Icon: FaRobot },
  { id: "ads", label: "Ads", Icon: FaBullhorn },
  { id: "accounts", label: "New accounts", Icon: FaUserPlus },
  { id: "payments", label: "Payment accounts", Icon: FaWallet },
  { id: "support", label: "Support contact", Icon: FaHeadset },
  { id: "announcement", label: "Announcement", Icon: FaBell },
];

function Status({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <span role={msg.ok ? "status" : "alert"} className={`flex items-center gap-1.5 text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>
      {msg.ok ? <FaCheck /> : <FaCircleExclamation />} {msg.text}
    </span>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-blue-900" : "bg-slate-300"}`}>
      <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function Section({ id, Icon, title, desc, children, footer }: { id: string; Icon: IconType; title: string; desc: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <section id={id} role="tabpanel" className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-900"><Icon className="size-4" /></span>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
      <div className="flex flex-wrap items-center gap-4 rounded-b-lg border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>
    </section>
  );
}

// run a save, show its result next to the button
function useSave() {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const save = (fn: () => Promise<{ error?: string }>, ok: string) =>
    start(async () => { const r = await fn(); setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: ok }); });
  return { msg, setMsg, pending, save };
}

export default function PlatformSettings(p: Props) {
  const [tab, setTab] = useState("ai");
  // open the tab named in the URL (?tab=ads) so links and reloads land in the right place
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t && NAV.some((n) => n.id === t)) setTab(t);
  }, []);
  const choose = (id: string) => { setTab(id); history.replaceState(null, "", `?tab=${id}`); };

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Settings sections" className="grid grid-cols-2 gap-1 rounded-xl sm:flex border border-slate-200 bg-white p-1.5 shadow-sm">
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={id} onClick={() => choose(id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2 py-2.5 text-xs font-semibold transition last:odd:col-span-2 sm:px-4 sm:text-sm ${tab === id ? "bg-blue-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* every section stays mounted so unsaved edits survive switching tabs */}
      <div>
        <div hidden={tab !== "ai"}><AiSection ai={p.ai} /></div>
        <div hidden={tab !== "ads"}><AdsSection adPrice={p.adPrice} adMin={p.adMin} adMax={p.adMax} /></div>
        <div hidden={tab !== "accounts"}><AccountsSection signupCredits={p.signupCredits} signupsOpen={p.signupsOpen} /></div>
        <div hidden={tab !== "payments"}><PaymentsSection methods={p.methods} /></div>
        <div hidden={tab !== "support"}><SupportSection support={p.support} /></div>
        <div hidden={tab !== "announcement"}><AnnouncementSection announcement={p.announcement} /></div>
      </div>
    </div>
  );
}

// ---------- AI ----------
function AiSection({ ai }: { ai: AiView }) {
  const [enabled, setEnabled] = useState(ai.enabled);
  const [model, setModel] = useState(ai.model);
  const [temperature, setTemperature] = useState(ai.temperature);
  const [keyHint, setKeyHint] = useState(ai.keyHint);
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [test, setTest] = useState<Msg>(null);
  const [testing, startTest] = useTransition();
  const { msg, setMsg, pending, save } = useSave();
  const live = enabled && !!(apiKey || keyHint);

  const submit = (clearKey = false) =>
    save(async () => {
      const r = await saveAiSettings({ apiKey, clearKey, model, temperature, enabled });
      if (!r.error) { setKeyHint(r.keyHint ?? ""); setApiKey(""); }
      return r;
    }, clearKey ? "Key removed" : "AI settings saved");

  return (
    <Section id="ai" Icon={FaRobot} title="AI & OpenRouter" desc="Writes the review drafts customers pick from. Without a key, built-in templates are used."
      footer={<>
        <button type="button" disabled={pending} onClick={() => submit()} className={saveBtn}>Save AI settings</button>
        <button type="button" disabled={testing} onClick={() => { setTest(null); startTest(async () => { const r = await testAiConnection(apiKey, model); setTest({ ok: r.ok, text: r.message }); }); }}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50">
          <FaPlug className="size-3" /> {testing ? "Testing…" : "Test connection"}
        </button>
        <Status msg={test ?? msg} />
      </>}>
      <div className={`mb-5 flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${live ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
        {live ? <FaCircleCheck className="shrink-0" /> : <FaTriangleExclamation className="shrink-0" />}
        <span className="flex-1">{live ? <>AI reviews are <b>on</b> using <b>{model}</b>.</> : enabled ? "No API key yet, so customers get template reviews." : "AI is turned off, so customers get template reviews."}</span>
        <Toggle on={enabled} onChange={(v) => { setEnabled(v); setMsg(null); }} label="Use AI for reviews" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <span className={small}>OpenRouter API key</span>
          {keyHint && !apiKey && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700"><FaKey className="size-3 text-slate-400" /> {keyHint}</span>
              <span className="text-xs text-slate-500">{ai.keyFromEnv ? "from the server’s environment" : "saved"}</span>
              {!ai.keyFromEnv && <button type="button" onClick={() => submit(true)} className="text-xs font-semibold text-rose-600 hover:underline">Remove key</button>}
            </div>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input value={apiKey} onChange={(e) => { setApiKey(e.target.value); setMsg(null); setTest(null); }} type={show ? "text" : "password"} autoComplete="off" spellCheck={false}
                placeholder={keyHint ? "Paste a new key to replace it" : "sk-or-v1-…"} aria-label="OpenRouter API key" className={`${field} pr-10 font-mono`} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide key" : "Show key"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
                {show ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <FaCircleInfo className="size-3" /> Stored on the server and never shown in full.
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline">Get a key <FaArrowUpRightFromSquare className="size-2.5" /></a>
          </p>
        </div>

        <label>
          <span className={small}>Model</span>
          <input value={model} onChange={(e) => { setModel(e.target.value); setMsg(null); setTest(null); }} list="ai-models" spellCheck={false} className={`${field} font-mono`} />
          <datalist id="ai-models">{MODELS.map((m) => <option key={m} value={m} />)}</datalist>
          <span className="mt-1.5 block text-xs text-slate-500">Any model ID from openrouter.ai/models</span>
        </label>

        <div>
          <span className={small}>Creativity · {temperature.toFixed(1)}</span>
          <input type="range" min={0} max={1.5} step={0.1} value={temperature} onChange={(e) => { setTemperature(Number(e.target.value)); setMsg(null); }}
            aria-label="Creativity" className="mt-2 w-full accent-blue-900" />
          <span className="mt-1 flex justify-between text-xs text-slate-400"><span>Consistent</span><span>Varied</span></span>
        </div>
      </div>
    </Section>
  );
}

// ---------- Ads ----------
function AdsSection(init: { adPrice: number; adMin: number; adMax: number }) {
  const [v, setV] = useState({ adPrice: String(init.adPrice), adMin: String(init.adMin), adMax: String(init.adMax) });
  const { msg, setMsg, pending, save } = useSave();
  const set = (k: keyof typeof v, x: string) => { setV({ ...v, [k]: x.replace(/\D/g, "").slice(0, 6) }); setMsg(null); };
  const num = (label: string, k: keyof typeof v, pre?: string, post?: string) => (
    <label>
      <span className={small}>{label}</span>
      <span className="flex items-center rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        {pre && <span className="pl-3 text-sm font-semibold text-slate-500">{pre}</span>}
        <input value={v[k]} onChange={(e) => set(k, e.target.value)} inputMode="numeric" aria-label={label} className="w-full min-w-0 bg-transparent px-3 py-2 text-base font-bold text-slate-900 outline-none" />
        {post && <span className="pr-3 text-sm text-slate-500">{post}</span>}
      </span>
    </label>
  );
  return (
    <Section id="ads" Icon={FaBullhorn} title="Ads" desc="Price and order size for paid review campaigns. Existing ads keep the price they were requested at."
      footer={<>
        <button type="button" disabled={pending} className={saveBtn}
          onClick={() => save(() => savePlatformSection("ads", { adPrice: Number(v.adPrice), adMin: Number(v.adMin), adMax: Number(v.adMax) }), "Ads settings saved")}>Save ads settings</button>
        <Status msg={msg} />
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {num("Price per review", "adPrice", "Rs")}
        {num("Minimum order", "adMin", undefined, "reviews")}
        {num("Maximum order", "adMax", undefined, "reviews")}
      </div>
      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Example: a 100-review ad costs <b className="text-slate-900">Rs {(Number(v.adPrice || 0) * 100).toLocaleString()}</b>.
      </p>
    </Section>
  );
}

// ---------- New accounts ----------
function AccountsSection(init: { signupCredits: number; signupsOpen: boolean }) {
  const [credits, setCredits] = useState(String(init.signupCredits));
  const [open, setOpen] = useState(init.signupsOpen);
  const { msg, setMsg, pending, save } = useSave();
  return (
    <Section id="accounts" Icon={FaUserPlus} title="New accounts" desc="What a business gets when it signs up, and whether sign-ups are open."
      footer={<>
        <button type="button" disabled={pending} className={saveBtn}
          onClick={() => save(() => savePlatformSection("accounts", { signupCredits: Number(credits), signupsOpen: open }), "Account settings saved")}>Save account settings</button>
        <Status msg={msg} />
      </>}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label>
          <span className={small}>Free AI credits on sign-up</span>
          <input value={credits} onChange={(e) => { setCredits(e.target.value.replace(/\D/g, "").slice(0, 6)); setMsg(null); }} inputMode="numeric" aria-label="Free AI credits on sign-up" className={`${field} text-base font-bold`} />
          <span className="mt-1.5 block text-xs text-slate-500">Each AI review uses 1 credit. Existing businesses aren’t changed.</span>
        </label>
        <div>
          <span className={small}>Sign-ups</span>
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${open ? "border-slate-200" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{open ? "Open to new businesses" : "Paused"}</p>
              <p className="text-xs text-slate-500">{open ? "Anyone can create an account." : "New visitors see “sign-ups are paused”."}</p>
            </div>
            <Toggle on={open} onChange={(x) => { setOpen(x); setMsg(null); }} label="Allow new sign-ups" />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ---------- Payment accounts ----------
function PaymentsSection({ methods: initial }: { methods: PaymentMethod[] }) {
  const [methods, setMethods] = useState(initial);
  const { msg, setMsg, pending, save } = useSave();
  const update = (id: string, patch: Partial<PaymentMethod>) => { setMethods((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m))); setMsg(null); };

  const addMethod = () => {
    const id = `m-${Date.now().toString(36)}`;
    setMethods((ms) => [...ms, { id, label: "", type: "wallet", enabled: true, qr: "", details: [{ label: "Account ID", value: "" }, { label: "Name", value: "" }] }]);
    setMsg(null);
    // focus the new name box once it renders
    setTimeout(() => (document.querySelector(`[data-method="${id}"] input[aria-label="Payment method name"]`) as HTMLInputElement | null)?.focus(), 50);
  };

  function loadQr(id: string, file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setMsg({ ok: false, text: "QR must be a PNG, JPG or WebP image." });
    if (file.size > QR_MAX_KB * 1024) return setMsg({ ok: false, text: `QR image must be under ${QR_MAX_KB} KB.` });
    const reader = new FileReader();
    reader.onload = () => update(id, { qr: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <Section id="payments" Icon={FaWallet} title="Payment accounts" desc="Shown to businesses when they pay for ads, top-ups and upgrades."
      footer={<>
        <button type="button" disabled={pending} className={saveBtn} onClick={() => save(() => savePaymentMethods(methods), "Payment accounts saved")}>Save payment accounts</button>
        <Status msg={msg} />
      </>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {methods.map((m) => (
          <div key={m.id} data-method={m.id} className={`rounded-lg border-2 p-5 transition ${m.enabled ? "border-slate-200" : "border-dashed border-slate-200 opacity-60"}`}>
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                {isBank(m) ? <FaBuildingColumns className="size-3.5" /> : <FaWallet className="size-3.5" />}
              </span>
              <input value={m.label} onChange={(e) => update(m.id, { label: e.target.value })} placeholder="Method name" aria-label="Payment method name"
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 font-bold text-slate-900 outline-none transition hover:border-slate-200 focus:border-blue-600 focus:bg-white" />
              <Toggle on={m.enabled} onChange={(v) => update(m.id, { enabled: v })} label={`${m.label || "Method"} on or off`} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div role="radiogroup" aria-label={`${m.label || "Method"} type`} className="inline-flex gap-0.5 rounded-md bg-slate-100 p-0.5 text-xs">
                {(["wallet", "bank"] as const).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={isBank(m) === (t === "bank")} onClick={() => update(m.id, { type: t })}
                    className={`rounded px-2.5 py-1 font-semibold transition ${isBank(m) === (t === "bank") ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    {t === "bank" ? "Bank" : "Wallet"}
                  </button>
                ))}
              </div>
              {methods.length > 1 && (
                <button type="button" onClick={() => { if (confirm(`Delete ${m.label || "this method"}? Businesses won't see it any more.`)) { setMethods((ms) => ms.filter((x) => x.id !== m.id)); setMsg(null); } }}
                  aria-label={`Delete ${m.label || "method"}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-rose-600">
                  <FaTrashCan className="size-3" /> Delete
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {m.qr ? <img src={m.qr} alt={`${m.label} QR`} className="size-full object-contain" /> : <span className="text-[11px] text-slate-400">No QR</span>}
              </span>
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
                  <FaCloudArrowUp /> {m.qr ? "Replace QR" : "Upload QR"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { loadQr(m.id, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                {m.qr && <button type="button" onClick={() => update(m.id, { qr: "" })} className="flex items-center gap-1.5 text-left text-sm font-semibold text-rose-600 hover:underline"><FaTrashCan className="size-3" /> Remove</button>}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {m.details.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input value={d.label} placeholder="Label" aria-label="Detail label" className={`${field} w-2/5`}
                    onChange={(e) => update(m.id, { details: m.details.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <input value={d.value} placeholder="Value" aria-label="Detail value" className={field}
                    onChange={(e) => update(m.id, { details: m.details.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <button type="button" aria-label="Remove detail" onClick={() => update(m.id, { details: m.details.filter((_, j) => j !== i) })} className="px-1 text-slate-400 hover:text-rose-600">
                    <FaTrashCan className="size-3.5" />
                  </button>
                </div>
              ))}
              {m.details.length < 6 && (
                <button type="button" onClick={() => update(m.id, { details: [...m.details, { label: "", value: "" }] })} className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
                  <FaPlus className="size-3" /> Add detail
                </button>
              )}
            </div>
          </div>
        ))}
        {methods.length < 8 && (
          <button type="button" onClick={addMethod}
            className="grid min-h-48 place-items-center rounded-lg border-2 border-dashed border-slate-300 p-5 text-center text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-800">
            <span>
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100"><FaPlus className="size-4" /></span>
              <span className="mt-3 block font-semibold">Add payment method</span>
              <span className="mt-0.5 block text-xs">e.g. IME Pay, Fonepay, another bank</span>
            </span>
          </button>
        )}
      </div>
    </Section>
  );
}

// ---------- Support contact ----------
function SupportSection({ support }: { support: SupportContact }) {
  const [v, setV] = useState(support);
  const { msg, setMsg, pending, save } = useSave();
  const input = (label: string, k: keyof SupportContact, placeholder: string, type = "text") => (
    <label>
      <span className={small}>{label}</span>
      <input value={v[k]} type={type} placeholder={placeholder} onChange={(e) => { setV({ ...v, [k]: e.target.value }); setMsg(null); }} aria-label={label} className={field} />
    </label>
  );
  return (
    <Section id="support" Icon={FaHeadset} title="Support contact" desc="How businesses reach you. Shown on their Support page. Leave a field empty to hide that button."
      footer={<>
        <button type="button" disabled={pending} className={saveBtn} onClick={() => save(() => savePlatformSection("support", v), "Support contact saved")}>Save support contact</button>
        <Status msg={msg} />
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {input("Support email", "email", "support@yourdomain.com", "email")}
        {input("Phone", "phone", "+977-98XXXXXXXX", "tel")}
        {input("WhatsApp link", "whatsapp", "https://wa.me/9779800000000", "url")}
        {input("Working hours", "hours", "(Sun–Fri, 10:00 AM – 6:00 PM)")}
      </div>
    </Section>
  );
}

// ---------- Announcement ----------
const TONES = {
  info: { label: "Info", cls: "bg-blue-50 text-blue-900 ring-blue-200", Icon: FaCircleInfo },
  warning: { label: "Warning", cls: "bg-amber-50 text-amber-900 ring-amber-200", Icon: FaTriangleExclamation },
  success: { label: "Good news", cls: "bg-emerald-50 text-emerald-900 ring-emerald-200", Icon: FaCircleCheck },
} as const;

export function AnnouncementBar({ a }: { a: Announcement }) {
  const t = TONES[a.tone];
  return (
    <div role="status" className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium ring-1 ${t.cls}`}>
      <t.Icon className="mt-0.5 shrink-0" /> <p className="min-w-0 flex-1">{a.text}</p>
    </div>
  );
}

function AnnouncementSection({ announcement }: { announcement: Announcement }) {
  const [v, setV] = useState(announcement);
  const { msg, setMsg, pending, save } = useSave();
  const set = (patch: Partial<Announcement>) => { setV({ ...v, ...patch }); setMsg(null); };
  return (
    <Section id="announcement" Icon={FaBell} title="Announcement" desc="A message at the top of every business dashboard, e.g. maintenance or a new feature."
      footer={<>
        <button type="button" disabled={pending} className={saveBtn} onClick={() => save(() => savePlatformSection("announcement", v), v.enabled ? "Announcement is live" : "Announcement saved (off)")}>Save announcement</button>
        <Status msg={msg} />
      </>}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{v.enabled ? "Showing to all businesses" : "Not showing"}</p>
        <Toggle on={v.enabled} onChange={(x) => set({ enabled: x })} label="Show announcement" />
      </div>
      <label className="mt-4 block">
        <span className={small}>Message · {v.text.length}/240</span>
        <textarea value={v.text} onChange={(e) => set({ text: e.target.value })} rows={2} maxLength={240} aria-label="Announcement message"
          placeholder="e.g. Scheduled maintenance on Saturday 10 PM – 11 PM. Review links keep working." className={`${field} resize-none leading-relaxed`} />
      </label>
      <div className="mt-4">
        <span className={small}>Style</span>
        <div role="radiogroup" aria-label="Announcement style" className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
          {(Object.keys(TONES) as Announcement["tone"][]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={v.tone === k} onClick={() => set({ tone: k })}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${v.tone === k ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {TONES[k].label}
            </button>
          ))}
        </div>
      </div>
      {v.text.trim() && (
        <div className="mt-5">
          <span className={small}>Preview</span>
          <AnnouncementBar a={v} />
        </div>
      )}
    </Section>
  );
}
