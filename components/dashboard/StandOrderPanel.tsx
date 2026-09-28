"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MdQrCode2 } from "react-icons/md";
import {
  FaTruckFast, FaPalette, FaCloudArrowUp, FaMinus, FaPlus, FaLocationDot, FaUser, FaPhone, FaCheck, FaCircleExclamation,
  FaBoxOpen, FaWandMagicSparkles, FaArrowRight, FaCircleXmark, FaClock, FaStar,
} from "react-icons/fa6";
import FileDrop from "@/components/ui/FileDrop";
import ManualPaymentDialog, { paymentForm, type ManualPayment } from "./ManualPaymentDialog";
import { orderStands, type StandOrderView } from "@/app/actions/stands";
import { PROVINCES, STAND_MAX, STAND_PRICE, STAND_STEPS } from "@/lib/site";
import type { PaymentMethod } from "@/lib/platform";

const npr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const field = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const label = "mb-1.5 block text-sm font-semibold text-slate-800";

const EMPTY = { fullName: "", phone: "", province: "", district: "", city: "", address: "", landmark: "", notes: "" };

// Acrylic table stand with the QR, drawn in CSS
function StandArt() {
  return (
    <div className="relative mx-auto h-44 w-32" aria-hidden>
      <div className="absolute inset-x-2 top-0 bottom-6 rotate-[-4deg] rounded-xl bg-white p-3 shadow-2xl ring-1 ring-white/40">
        <p className="text-center text-[8px] font-extrabold uppercase tracking-wider text-blue-950">Review us on Google</p>
        <MdQrCode2 className="mx-auto mt-1 size-20 text-blue-950" />
        <div className="mt-0.5 flex justify-center gap-0.5 text-amber-400">{[0, 1, 2, 3, 4].map((i) => <FaStar key={i} className="size-2" />)}</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-7 rounded-lg bg-white/25 ring-1 ring-white/30" />
    </div>
  );
}

export default function StandOrderPanel({ orders, methods, businessName }: { orders: StandOrderView[]; methods: PaymentMethod[]; businessName: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [design, setDesign] = useState<"standard" | "custom">("standard");
  const [file, setFile] = useState<File | null>(null);
  const [qty, setQty] = useState(1);
  const [v, setV] = useState(EMPTY);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [, start] = useTransition();
  const total = qty * STAND_PRICE;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setError(""); };

  function toPayment(e: React.FormEvent) {
    e.preventDefault();
    if (design === "custom" && !file) return setError("Upload your design, or choose our standard design.");
    setError("");
    dialog.current?.showModal();
  }
  const submit = (p: ManualPayment) =>
    start(async () => {
      const data = paymentForm({ ...v, quantity: String(qty), design }, p);
      if (design === "custom" && file) data.set("designFile", file);
      const r = await orderStands(data);
      if (r.error) return setError(r.error);
      setSent(true); setV(EMPTY); setFile(null); setQty(1); setDesign("standard");
      router.refresh();
    });

  return (
    <div className="space-y-6">
      {/* offer */}
      <section className="grid items-center gap-6 overflow-hidden rounded-3xl bg-blue-950 p-6 text-white shadow-xl shadow-blue-900/20 sm:grid-cols-[1fr_auto] sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">QR code stand</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Put your review QR on every table</h2>
          <p className="mt-2 max-w-md text-blue-100/90">A sturdy acrylic stand with your QR code, printed and delivered to your door. Customers scan it and leave a review in seconds.</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-amber-300 px-4 py-1.5 font-bold text-blue-950">{npr(STAND_PRICE)} per stand</span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold ring-1 ring-white/15"><FaTruckFast className="text-emerald-300" /> Free delivery all over Nepal</span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold ring-1 ring-white/15"><FaClock className="text-amber-300" /> 3–5 working days</span>
          </div>
        </div>
        <StandArt />
      </section>

      {sent && (
        <p role="status" className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          <FaCheck className="shrink-0" /> Order received! We’ll check your payment and start printing. Follow it under “Your orders” below.
        </p>
      )}

      {/* order form */}
      <form onSubmit={toPayment} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Order stands</h2>

        <p className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid size-6 place-items-center rounded-full bg-blue-900 text-xs text-white">1</span> Design</p>
        <div role="radiogroup" aria-label="Design" className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            ["standard", FaWandMagicSparkles, "Our standard design", `Your QR code, “${businessName}” and “Review us on Google”.`],
            ["custom", FaPalette, "Upload my own design", "Use your artwork. We’ll print it as it is."],
          ] as const).map(([id, Icon, title, text]) => (
            <button key={id} type="button" role="radio" aria-checked={design === id} onClick={() => { setDesign(id); setError(""); }}
              className={`flex gap-3 rounded-2xl border-2 p-4 text-left transition ${design === id ? "border-blue-900 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${design === id ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="size-4" /></span>
              <span><span className="block font-semibold text-slate-900">{title}</span><span className="block text-xs text-slate-500">{text}</span></span>
            </button>
          ))}
        </div>
        {design === "custom" && (
          <div className="mt-3">
            <FileDrop file={file} onChange={(f) => { setFile(f); setError(""); }} title="Drag your design here or" hint="JPG, PNG, WebP or PDF · up to 5 MB · print-ready size works best" />
          </div>
        )}

        <p className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid size-6 place-items-center rounded-full bg-blue-900 text-xs text-white">2</span> Quantity</p>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <div className="flex items-center rounded-xl border border-slate-200">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One less" className="grid size-11 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-30"><FaMinus className="size-3" /></button>
            <input value={qty} onChange={(e) => setQty(Math.min(STAND_MAX, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} inputMode="numeric" aria-label="Number of stands"
              className="w-14 border-x border-slate-200 py-2.5 text-center text-lg font-bold text-slate-900 outline-none" />
            <button type="button" onClick={() => setQty((q) => Math.min(STAND_MAX, q + 1))} disabled={qty >= STAND_MAX} aria-label="One more" className="grid size-11 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-30"><FaPlus className="size-3" /></button>
          </div>
          <p className="text-sm text-slate-500">{qty} × {npr(STAND_PRICE)} + <span className="font-semibold text-emerald-700">free delivery</span> = <b className="text-xl text-slate-900">{npr(total)}</b></p>
        </div>

        <p className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid size-6 place-items-center rounded-full bg-blue-900 text-xs text-white">3</span> Delivery details</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label><span className={label}>Receiver’s full name</span>
            <span className="relative block"><FaUser className="absolute left-4 top-1/2 size-3 -translate-y-1/2 text-slate-400" /><input required value={v.fullName} onChange={set("fullName")} autoComplete="name" placeholder="e.g. Sita Sharma" className={`${field} pl-10`} /></span>
          </label>
          <label><span className={label}>Phone number</span>
            <span className="relative block"><FaPhone className="absolute left-4 top-1/2 size-3 -translate-y-1/2 text-slate-400" /><input required type="tel" value={v.phone} onChange={set("phone")} autoComplete="tel" placeholder="+977-98XXXXXXXX" className={`${field} pl-10`} /></span>
          </label>
          <label><span className={label}>Province</span>
            <select required value={v.province} onChange={set("province")} aria-label="Province" className={field}>
              <option value="" disabled>Choose province</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label><span className={label}>District</span><input required value={v.district} onChange={set("district")} placeholder="e.g. Kathmandu" className={field} /></label>
          <label><span className={label}>City / municipality</span><input required value={v.city} onChange={set("city")} placeholder="e.g. Kathmandu Metropolitan City" className={field} /></label>
          <label><span className={label}>Full address</span>
            <span className="relative block"><FaLocationDot className="absolute left-4 top-1/2 size-3 -translate-y-1/2 text-slate-400" /><input required value={v.address} onChange={set("address")} autoComplete="street-address" placeholder="Ward no., tole, street, house" className={`${field} pl-10`} /></span>
          </label>
          <label><span className={label}>Nearby landmark <span className="font-normal text-slate-400">(optional)</span></span><input value={v.landmark} onChange={set("landmark")} placeholder="e.g. Opposite Bhatbhateni" className={field} /></label>
          <label><span className={label}>Notes for delivery <span className="font-normal text-slate-400">(optional)</span></span><input value={v.notes} onChange={set("notes")} placeholder="e.g. Call before coming, open 10 AM–8 PM" className={field} /></label>
        </div>

        {error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"><FaCircleExclamation className="shrink-0" /> {error}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">Total <b className="text-lg text-slate-900">{npr(total)}</b> · delivery included</p>
          <button className="flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
            Continue to payment <FaArrowRight className="size-3.5" />
          </button>
        </div>
      </form>

      {/* history */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FaBoxOpen className="text-blue-800" /> Your orders</h2>
        {!orders.length ? (
          <p className="mt-4 text-sm text-slate-500">No stand orders yet.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {orders.map((o) => {
              const at = STAND_STEPS.findIndex((s) => s.id === o.status);
              const rejected = o.status === "rejected";
              return (
                <li key={o.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{o.quantity} stand{o.quantity > 1 ? "s" : ""} · {o.design === "custom" ? "Your design" : "Standard design"}</p>
                    <p className="text-sm text-slate-500">{npr(o.amount)} · ordered {fmt(o.createdAt)}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><FaLocationDot className="size-3" /> {o.fullName}, {o.address}</p>
                  {rejected ? (
                    <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><FaCircleXmark className="shrink-0" /> We couldn’t verify this payment. Please contact support or order again.</p>
                  ) : (
                    <ol className="mt-5 grid grid-cols-4 gap-2">
                      {STAND_STEPS.map((s, i) => (
                        <li key={s.id} className="text-center">
                          <span className={`block h-1.5 rounded-full ${i <= at ? (i === at && o.status !== "delivered" ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200"}`} />
                          <span className={`mt-2 block text-[11px] font-semibold sm:text-xs ${i <= at ? "text-slate-800" : "text-slate-400"}`}>{s.label}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ManualPaymentDialog ref={dialog} amount={total} title={`${qty} QR stand${qty > 1 ? "s" : ""} · free delivery`} methods={methods} onSubmit={submit} />
    </div>
  );
}
