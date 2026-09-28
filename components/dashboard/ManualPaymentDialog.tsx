"use client";

import { forwardRef, useState } from "react";
import {
  FaXmark, FaTriangleExclamation, FaCheck, FaCopy, FaWhatsapp, FaPaperPlane, FaWallet, FaBuildingColumns, FaDownload,
} from "react-icons/fa6";
import { npr } from "@/components/ui/PaymentMethods";
import FileDrop from "@/components/ui/FileDrop";
import { site } from "@/lib/site";
import type { PaymentMethod } from "@/lib/platform";
import { isBank } from "@/lib/site";

export type ManualPayment = { method: string; txnId: string; proof: File };

// FormData for the payment server actions: extra fields + the chosen method, txn id and proof file
export function paymentForm(fields: Record<string, string>, p: ManualPayment) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  data.set("method", p.method);
  data.set("txnId", p.txnId);
  data.set("proof", p.proof);
  return data;
}

function CopyValue({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={`Copy ${value}`} title="Copy"
      onClick={async () => { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200); }}
      className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-700">
      {done ? <FaCheck className="size-3 text-emerald-600" /> : <FaCopy className="size-3" />}
    </button>
  );
}

// Manual payment step: pick method, pay to shown account, upload proof. Super admin verifies later.
const ManualPaymentDialog = forwardRef<HTMLDialogElement, { amount: number; title: string; methods: PaymentMethod[]; onSubmit: (p: ManualPayment) => void }>(
  function ManualPaymentDialog({ amount, title, methods, onSubmit }, ref) {
    const [method, setMethod] = useState(methods[0]?.id ?? "");
    const [txnId, setTxnId] = useState("");
    const [proof, setProof] = useState<File | null>(null);
    const [error, setError] = useState("");
    const account = methods.find((m) => m.id === method) ?? methods[0];
    const close = () => (ref as React.RefObject<HTMLDialogElement>).current?.close();

    function reset() {
      setTxnId(""); setProof(null); setError("");
    }

    function submit(e: React.FormEvent) {
      e.preventDefault();
      if (!proof) return setError("Please upload your payment proof.");
      onSubmit({ method, txnId: txnId.trim(), proof });
      reset();
      close();
    }

    return (
      <dialog ref={ref} onClick={(e) => e.target === e.currentTarget && close()}
        className="auth-dialog no-scrollbar m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
        <form onSubmit={submit}>
          {/* Header */}
          <div className="bg-blue-950 px-7 pb-6 pt-7 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-200">{title}</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{npr(amount)}</p>
                <p className="mt-1 text-sm text-blue-200">Amount to pay</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-full text-blue-200 hover:bg-white/10 hover:text-white">
                <FaXmark className="size-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6 p-7">
            {/* Notice */}
            <div role="note" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <FaTriangleExclamation className="mt-0.5 shrink-0 text-amber-500" />
              <p>
                <b className="font-semibold">Online payment isn’t available yet.</b> Please pay using one of the options below and upload your payment
                proof. Our team usually verifies it <b className="font-semibold">within a few hours</b>. Need help?{" "}
                <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Contact support</a>.
              </p>
            </div>

            {/* Step 1 */}
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="grid size-5 place-items-center rounded-full bg-blue-900 text-[11px] text-white">1</span> Choose how you’ll pay
              </p>
              <div role="radiogroup" aria-label="Payment method" className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, methods.length))}, 1fr)` }}>
                {methods.map((m) => {
                  const Icon = isBank(m) ? FaBuildingColumns : FaWallet;
                  return (
                    <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 text-sm font-semibold transition ${method === m.id ? "border-blue-900 bg-blue-50/60 text-blue-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      <Icon className="size-4" /> {m.label}
                    </button>
                  );
                })}
              </div>
              <div key={method} className="tab-fade mt-3 flex flex-col gap-4 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center">
                {account.qr && (
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <img src={account.qr} alt={`${account.label} payment QR code`} className="size-32 rounded-lg border border-slate-200 bg-white p-1.5" />
                    <a href={account.qr} download={`${account.id}-payment-qr.png`} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
                      <FaDownload className="size-2.5" /> Save QR
                    </a>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {account.qr && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Scan the QR or pay to</p>}
                  <dl className="divide-y divide-slate-200/70">
                    {account.details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between gap-4 py-2 text-sm">
                        <dt className="text-slate-500">{d.label}</dt>
                        <dd className="flex min-w-0 items-center gap-1 text-right font-semibold text-slate-900"><span className="truncate">{d.value}</span> <CopyValue value={d.value} /></dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="grid size-5 place-items-center rounded-full bg-blue-900 text-[11px] text-white">2</span> Upload payment proof
              </p>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-slate-500">Transaction ID (optional)</span>
                <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 0A1B2C3"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>

              <div className="mt-3">
                <FileDrop file={proof} onChange={(f) => { setProof(f); if (f) setError(""); }} title="Drag your receipt here or" hint="Receipt or screenshot · JPG, PNG, WebP or PDF · up to 5 MB" />
              </div>
              {error && <p role="alert" className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
              <FaPaperPlane className="size-3.5" /> Submit for approval
            </button>
            <p className="-mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              Questions about your payment?
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                <FaWhatsapp /> WhatsApp support
              </a>
            </p>
          </div>
        </form>
      </dialog>
    );
  }
);

export default ManualPaymentDialog;
