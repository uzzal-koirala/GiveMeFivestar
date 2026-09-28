"use client";

// Shared "waiting for approval" / "approved" / "rejected" designs, used by the sign-up plan step and the dashboard
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import { FaCheck, FaHourglassHalf, FaPaperPlane, FaMagnifyingGlass, FaClock, FaWhatsapp, FaXmark, FaTriangleExclamation } from "react-icons/fa6";

// Support hours in Nepal time: Sunday–Friday, 10:00–18:00
function estimate(): { title: string; text: string } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  const saturday = parts.weekday === "Sat";
  if (!saturday && hour >= 10 && hour < 17) return { title: "About 1–2 hours", text: "Our team is online now and checking payments." };
  if (!saturday && hour < 10) return { title: "Today, after 10:00 AM", text: "We start checking payments at 10:00 AM Nepal time." };
  return { title: "Next working day", text: "We check payments Sunday to Friday, 10:00 AM – 6:00 PM Nepal time." };
}
export const since = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min ago` : `${Math.floor(m / 1440)} day${m >= 2880 ? "s" : ""} ago`;
};

const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
    <FaXmark />
  </button>
);

// Pulsing hourglass, estimate, three steps; re-checks the server every 20 s
export function WaitingCard({ sentAt, message, done, whatsapp, onClose, closeHint }: {
  sentAt: string; message: React.ReactNode; done: { Icon: IconType; title: string }; whatsapp: string; onClose?: () => void; closeHint?: string;
}) {
  const router = useRouter();
  const [, tick] = useState(0);
  const [eta, setEta] = useState<{ title: string; text: string } | null>(null);
  useEffect(() => {
    setEta(estimate());
    const poll = setInterval(() => router.refresh(), 20_000);
    const clock = setInterval(() => { tick((n) => n + 1); setEta(estimate()); }, 30_000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [router]);

  const steps: { Icon: IconType; title: string; text: string; status: "done" | "active" | "todo" }[] = [
    { Icon: FaPaperPlane, title: "Payment proof sent", text: since(sentAt), status: "done" },
    { Icon: FaMagnifyingGlass, title: "Verifying your payment", text: "A real person on our team is checking it", status: "active" },
    { Icon: done.Icon, title: done.title, text: "You’ll see this change on its own", status: "todo" },
  ];

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
      {onClose && <CloseButton onClose={onClose} />}
      <div className="px-6 pb-8 pt-10 text-center sm:px-10">
        <div className="relative mx-auto grid size-28 place-items-center">
          <span className="wait-ring absolute inset-0 rounded-full bg-amber-300/40" />
          <span className="wait-ring absolute inset-0 rounded-full bg-amber-300/40 [animation-delay:1.2s]" />
          <span className="relative grid size-20 place-items-center rounded-full bg-amber-300 text-blue-950 shadow-lg shadow-amber-400/40">
            <FaHourglassHalf className="wait-flip size-8" />
          </span>
        </div>
        <h2 className="mt-7 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Please wait while we approve your payment</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-500">{message}</p>
        {eta && (
          <div className="mx-auto mt-7 flex max-w-md items-center gap-4 rounded-xl bg-blue-950 px-5 py-4 text-left text-white">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300"><FaClock className="size-5" /></span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-blue-200">Estimated waiting time</span>
              <span className="block text-lg font-bold">{eta.title}</span>
              <span className="block text-xs text-blue-200">{eta.text}</span>
            </span>
          </div>
        )}
      </div>

      <ol className="space-y-5 border-t border-slate-100 bg-slate-50 px-6 py-7 sm:px-10">
        {steps.map(({ Icon, title, text, status }, i) => (
          <li key={title} className="relative flex gap-4 text-left">
            {i < steps.length - 1 && <span className={`absolute left-[19px] top-10 h-[calc(100%-12px)] w-0.5 ${status === "done" ? "bg-emerald-400" : "bg-slate-200"}`} />}
            <span className={`relative grid size-10 shrink-0 place-items-center rounded-full ${status === "done" ? "bg-emerald-500 text-white" : status === "active" ? "bg-amber-300 text-blue-950" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
              {status === "done" ? <FaCheck className="size-3.5" /> : <Icon className={`size-3.5 ${status === "active" ? "wait-bob" : ""}`} />}
            </span>
            <span className="pt-1">
              <span className={`block font-semibold ${status === "todo" ? "text-slate-400" : "text-slate-900"}`}>{title}</span>
              <span className="block text-sm text-slate-500">{text}</span>
            </span>
            {status === "active" && <span className="ml-auto mt-2 flex gap-1" aria-hidden>{[0, 1, 2].map((d) => <span key={d} className="wait-dot size-1.5 rounded-full bg-amber-500" style={{ animationDelay: `${d * 0.2}s` }} />)}</span>}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm sm:px-10">
        <span className="flex items-center gap-2 text-slate-500"><span className="size-2 animate-pulse rounded-full bg-emerald-500" /> {closeHint ?? "Checking automatically"}</span>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-emerald-700 hover:underline">
          <FaWhatsapp className="size-4" /> Taking too long? Message us
        </a>
      </div>
    </div>
  );
}

const CONFETTI = ["bg-amber-300", "bg-emerald-400", "bg-sky-400", "bg-rose-400", "bg-white"];

// Confetti, big tick, what they got, and one action
export function ApprovedCard({ heading, text, stats, action, onClose }: {
  heading: string; text: React.ReactNode; stats: { Icon: IconType; label: string; value: string }[]; action: React.ReactNode; onClose?: () => void;
}) {
  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white text-center shadow-xl ring-1 ring-slate-200">
      {onClose && <CloseButton onClose={onClose} />}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className={`confetti absolute top-0 block h-3 w-1.5 rounded-sm ${CONFETTI[i % CONFETTI.length]} ${i % 5 === 4 ? "ring-1 ring-slate-200" : ""}`}
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.25}s`, animationDuration: `${2.4 + (i % 5) * 0.4}s` }} />
        ))}
      </div>
      <div className="relative px-6 pb-8 pt-12 sm:px-10">
        <span className="pop-in mx-auto grid size-24 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-100">
          <FaCheck className="size-10" />
        </span>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Payment approved</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-500">{text}</p>
        <div className={`mx-auto mt-8 grid max-w-lg gap-3 ${stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {stats.map(({ Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-slate-50 px-3 py-4 ring-1 ring-slate-100">
              <Icon className="mx-auto size-4 text-amber-500" />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        {action}
      </div>
    </div>
  );
}

export function RejectedCard({ text, whatsapp, action }: { text: React.ReactNode; whatsapp: string; action: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl bg-white px-6 pb-8 pt-10 text-center shadow-xl ring-1 ring-slate-200 sm:px-10">
      <span className="pop-in mx-auto grid size-20 place-items-center rounded-full bg-rose-100 text-rose-600 ring-8 ring-rose-50"><FaTriangleExclamation className="size-8" /></span>
      <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">We couldn&apos;t verify your payment</h2>
      <p className="mx-auto mt-2 max-w-sm text-slate-500">{text}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {action}
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <FaWhatsapp className="size-4" /> Message us
        </a>
      </div>
    </div>
  );
}
