// Landing hero (light): brand pill, centered promise, "works with" icon row, and a preview of the real owner dashboard cropped at the bottom
import type { IconType } from "react-icons";
import {
  FaArrowRight, FaCircleCheck, FaStar, FaGoogle, FaWandMagicSparkles, FaQrcode, FaWhatsapp, FaLanguage, FaMobileScreen,
  FaChartPie, FaUsers, FaGear, FaArrowTrendUp, FaBullhorn, FaHeadset, FaSun, FaCalendarWeek, FaBolt, FaPlus, FaChartLine, FaCopy, FaDownload,
} from "react-icons/fa6";
import { MdQrCode2, MdWavingHand } from "react-icons/md";
import QRCode from "qrcode";
import { monotonePath } from "@/lib/chart";
import { GiLotus } from "react-icons/gi";
import AuthButton from "@/components/auth/AuthButton";
import RotatingWords from "./RotatingWords";

const BADGES: { Icon: IconType; label: string; cls: string }[] = [
  { Icon: FaGoogle, label: "Google reviews", cls: "text-blue-600" },
  { Icon: FaQrcode, label: "QR codes", cls: "text-blue-950" },
  { Icon: FaWandMagicSparkles, label: "AI writing", cls: "text-amber-500" },
  { Icon: FaStar, label: "5-star ratings", cls: "text-amber-400" },
  { Icon: FaWhatsapp, label: "WhatsApp sharing", cls: "text-emerald-600" },
  { Icon: FaLanguage, label: "English & Nepali", cls: "text-rose-500" },
  { Icon: FaMobileScreen, label: "Any phone", cls: "text-sky-600" },
];

// ---------- dashboard preview: a scaled copy of the real owner dashboard (/dashboard) ----------
const NAV: [IconType, string][] = [[FaChartPie, "Overview"], [FaStar, "Reviews"], [FaUsers, "Customers"], [FaBullhorn, "Ads"], [FaHeadset, "Support"], [FaGear, "Settings"]];
const STATS: { Icon: IconType; label: string; value: string; tint: string; delta?: string; plus?: boolean }[] = [
  { Icon: FaStar, label: "Total responses", value: "318", tint: "bg-amber-100 text-amber-700" },
  { Icon: FaSun, label: "Today", value: "6", tint: "bg-violet-100 text-violet-700", delta: "+50%" },
  { Icon: FaCalendarWeek, label: "This week", value: "27", tint: "bg-blue-100 text-blue-800", delta: "+23%" },
  { Icon: FaBolt, label: "AI reviews left", value: "Unlimited", tint: "bg-emerald-100 text-emerald-700", plus: true },
];
const DAYS = [2, 3, 2, 4, 3, 5, 4, 3, 5, 6, 4, 6, 7, 6]; // responses per day, last 14 days
const DAY_LABELS = ["Sep 14", "Sep 18", "Sep 22", "Sep 27"];

function LineChart() {
  const top = 8;
  const line = monotonePath(DAYS.map((_, i) => (i / (DAYS.length - 1)) * 100), DAYS.map((v) => 100 - (v / top) * 100));
  return (
    <div className="mt-4 flex h-36 gap-2 sm:h-44">
      <div className="flex flex-col justify-between pb-6 text-right text-[10px] text-slate-400"><span>8</span><span>4</span><span>0</span></div>
      <div className="relative flex-1">
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
          <span className="border-t border-dashed border-slate-100" /><span className="border-t border-dashed border-slate-100" /><span className="border-t border-slate-300" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full overflow-visible">
            <path d={`${line} L100,100 L0,100 Z`} fill="#2563eb" fillOpacity="0.08" />
            <path d={line} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow" style={{ left: `${(12 / 13) * 100}%`, top: `${100 - (7 / top) * 100}%` }} />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-slate-400">{DAY_LABELS.map((d) => <span key={d}>{d}</span>)}</div>
      </div>
    </div>
  );
}

function Dashboard({ qr }: { qr: string }) {
  return (
    <div className="hero-phone relative mx-auto max-w-5xl overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-slate-50 text-left shadow-[0_-10px_60px_-15px_rgba(23,37,84,0.3)]">
      {/* browser bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-300" /><span className="size-2.5 rounded-full bg-amber-300" /><span className="size-2.5 rounded-full bg-emerald-300" />
        <span className="mx-auto hidden rounded-md bg-slate-50 px-10 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200 sm:block">givemefivestar.com/dashboard</span>
      </div>

      <div className="h-[290px] overflow-hidden sm:h-[400px]">
        {/* navy top: nav + greeting, same as the real dashboard */}
        <div className="bg-blue-950 px-4 pb-24 text-white sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm font-extrabold tracking-[0.15em]"><MdQrCode2 className="size-6 text-amber-300" /><span className="hidden sm:inline">GIVE ME FIVE STAR</span></span>
            <span className="flex gap-0.5 rounded-full bg-white/10 p-1">
              {NAV.map(([Icon, label], i) => (
                <span key={label} className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium sm:px-3 ${i === 0 ? "bg-white text-blue-950 shadow" : "text-blue-100"}`}>
                  <Icon className="size-3" /><span className="hidden lg:inline">{label}</span>
                </span>
              ))}
            </span>
            <span className="grid size-8 place-items-center rounded-full bg-emerald-800 text-amber-200 ring-2 ring-white/20"><GiLotus className="size-4" /></span>
          </div>
          <p className="mt-5 text-xs font-medium text-blue-200">Saturday, 27 September</p>
          <p className="mt-1 flex items-center gap-2 text-xl font-bold sm:text-2xl">Welcome back, Sita <MdWavingHand className="text-amber-300" /></p>
        </div>

        <div className="-mt-16 space-y-4 px-4 pb-6 sm:px-6">
          {/* stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map(({ Icon, label, value, tint, delta, plus }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg sm:size-10 ${tint}`}><Icon className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-slate-500 sm:text-xs">{label}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">{value}</p>
                    {delta && <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-flex"><FaArrowTrendUp className="size-2.5" /> {delta}</span>}
                    {plus && <span className="ml-auto hidden size-6 place-items-center rounded-full bg-blue-900 text-white sm:grid"><FaPlus className="size-2.5" /></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* chart + QR */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><FaChartLine className="text-blue-700" /> Responses per day</p>
                  <p className="mt-0.5 text-xs text-slate-500">Last 14 days</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-slate-900">60</p>
                  <p className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700"><FaArrowTrendUp className="size-2.5" /> +36%</span>
                    <span className="hidden sm:inline">vs previous 14 days</span>
                  </p>
                </div>
              </div>
              <LineChart />
            </div>

            <div className="hidden flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><FaQrcode className="text-blue-700" /> Your review QR</p>
              <p className="mt-0.5 text-xs text-slate-500">Customers scan this to leave a review</p>
              <div className="mt-3 grid flex-1 place-items-center rounded-lg bg-blue-950 p-4">
                <div className="rounded-lg bg-white p-2 shadow-xl"><div className="size-24 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} /></div>
              </div>
              <p className="mt-3 truncate rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">givemefivestar.com/r/mandala-paradise</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-semibold">
                <span className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-slate-700"><FaCopy className="size-3" /> Copy link</span>
                <span className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 py-2 text-white"><FaDownload className="size-3" /> Download</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Hero() {
  // a real, scannable code for the QR card in the preview
  const qr = await QRCode.toString("https://givemefivestar.com", { type: "svg", margin: 0, color: { dark: "#172554", light: "#ffffff" } });
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f4f7fc]">
      {/* soft rings for depth (solid lines, no gradients) */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 size-[1100px] -translate-x-1/2">
        {[0, 1, 2].map((i) => <span key={i} className="absolute rounded-full border border-blue-900/[0.06]" style={{ inset: `${i * 150}px` }} />)}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-10 text-center sm:pt-14">
        <div className="hero-in">
          <p className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <span className="grid size-7 place-items-center rounded-full bg-blue-950 text-amber-300"><MdQrCode2 className="size-4" /></span>
            AI Google reviews for businesses worldwide
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(1.2rem,6.3vw,2.25rem)] font-extrabold leading-[1.15] tracking-tight text-blue-950 sm:text-[3.5rem]">
            <span className="whitespace-nowrap sm:whitespace-normal">Turn happy customers into</span>{" "}
            <span className="block text-blue-700 sm:inline-block">
              <RotatingWords words={["5-star reviews", "loyal regulars", "more bookings", "top Google ranks"]} />
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Customers scan your QR code, tap a rating, and AI writes their Google review in seconds. One tap and it&apos;s posted.
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {BADGES.map(({ Icon, label, cls }) => (
              <li key={label} title={label} className="grid size-10 place-items-center rounded-full bg-white shadow-sm sm:size-12 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                <Icon className={`size-4 sm:size-5 ${cls}`} aria-label={label} />
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <AuthButton className="group flex items-center gap-2 rounded-lg bg-blue-950 px-6 py-3.5 font-bold text-white transition hover:bg-blue-900">
              Start free <FaArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
            </AuthButton>
            <a href="#how-it-works" className="rounded-lg bg-white px-6 py-3.5 font-semibold text-blue-950 ring-1 ring-slate-200 transition hover:bg-slate-50">How it works</a>
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {["Free plan forever", "No card needed", "Ready in 2 minutes"].map((t) => (
              <li key={t} className="flex items-center gap-2"><FaCircleCheck className="size-3.5 text-emerald-500" /> {t}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 sm:mt-12"><Dashboard qr={qr} /></div>
      </div>
    </section>
  );
}
