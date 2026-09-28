// Home page sections under the hero: features, solutions, why us, pricing preview, final call to action
import type { IconType } from "react-icons";
import {
  FaWandMagicSparkles, FaQrcode, FaChartColumn, FaCommentDots, FaLanguage, FaHashtag,
  FaWallet, FaWhatsapp, FaGlobe, FaMobileScreen, FaArrowRight, FaShieldHalved, FaMoneyBillWave, FaStar, FaGoogle, FaCircleCheck,
  FaHandshake, FaHeart, FaLocationDot, FaMapLocationDot, FaTrophy, FaArrowTrendUp, FaMagnifyingGlass, FaDiamondTurnRight, FaPhone, FaBowlFood, FaSignal, FaWifi, FaBatteryThreeQuarters, FaBookmark, FaBell,
} from "react-icons/fa6";
import AuthButton from "@/components/auth/AuthButton";
import PricingSection from "./PricingSection";
import ContactSection from "./ContactSection";
import Testimonials from "./Testimonials";
import BrandStrip from "./BrandStrip";
import Solutions from "./Solutions";
import { getPlatform } from "@/lib/platform";

const npr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

function Heading({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text: string; dark?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={`text-sm font-bold uppercase tracking-[0.2em] ${dark ? "text-amber-300" : "text-blue-700"}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
      <p className={`mt-4 text-lg ${dark ? "text-blue-100/85" : "text-slate-600"}`}>{text}</p>
    </div>
  );
}

// ---------- Numbers band under the hero (product facts, not made-up usage stats) ----------
const NUMBERS: { Icon: IconType; value: string; label: string }[] = [
  { Icon: FaWandMagicSparkles, value: "3 sec", label: "for AI to write a review" },
  { Icon: FaQrcode, value: "2 min", label: "to set up your QR code" },
  { Icon: FaLanguage, value: "3", label: "review styles: English, Nepali or mixed" },
  { Icon: FaMobileScreen, value: "0", label: "apps for customers to install" },
  { Icon: FaMoneyBillWave, value: "Free", label: "to start, free plan forever" },
];

function NumbersBand() {
  return (
    <section aria-label="Give Me Five Star in numbers" className="bg-blue-900 py-6 text-white sm:py-10">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-2.5 px-4 sm:gap-4 lg:grid-cols-5">
        {NUMBERS.map(({ Icon, value, label }, i) => (
          <li key={label} className={`flex items-center gap-2.5 rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/15 sm:gap-3 sm:p-4 ${i === NUMBERS.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-300 text-blue-950 sm:size-10"><Icon className="size-3.5 sm:size-4" /></span>
            <span className="min-w-0">
              <span className="block text-xl font-extrabold sm:text-2xl leading-none tracking-tight">{value}</span>
              <span className="mt-1 block text-xs leading-snug text-blue-100/85">{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- Why Google reviews ----------
const WHY: { Icon: IconType; title: string; text: string }[] = [
  { Icon: FaMapLocationDot, title: "Rank higher on Google Maps", text: "Reviews are one of the signals Google uses to decide who shows up first nearby." },
  { Icon: FaTrophy, title: "Beat nearby competitors", text: "When people search “near me”, they pick the place with more stars and more reviews." },
  { Icon: FaHashtag, title: "Show up for the right words", text: "Reviews that mention your dishes, services and area help you match more searches." },
  { Icon: FaArrowTrendUp, title: "Stay fresh, stay on top", text: "A steady flow of new reviews tells Google and customers you're active and loved." },
];

const MAP_RESULTS = [
  { name: "Your Business", rating: 4.9, reviews: 318, meta: "Momo restaurant · 350 m", hours: "Closes 10 PM", tint: "bg-amber-100 text-amber-700", you: true },
  { name: "Momo Corner", rating: 4.2, reviews: 41, meta: "Momo restaurant · 800 m", hours: "Closes 9 PM", tint: "bg-slate-100 text-slate-400" },
  { name: "Tasty Bites", rating: 3.9, reviews: 12, meta: "Fast food · 1.2 km", hours: "Closes 8 PM", tint: "bg-slate-100 text-slate-400" },
];

function RatingRow({ rating, reviews, strong }: { rating: number; reviews: number; strong?: boolean }) {
  return (
    <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
      <span className={strong ? "font-semibold text-slate-800" : ""}>{rating.toFixed(1)}</span>
      <span className="flex">{[1, 2, 3, 4, 5].map((s) => <FaStar key={s} className={`size-3 ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-200"}`} />)}</span>
      <span>({reviews})</span>
    </p>
  );
}

// Map illustration: land, park, river, roads and labelled pins (solid colours only)
function MapArt() {
  return (
    <div className="relative h-28 overflow-hidden bg-[#eef0e8] sm:h-36">
      <svg viewBox="0 0 400 176" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0 size-full">
        <rect x="250" y="-10" width="170" height="80" rx="10" fill="#cfe8c4" />
        <path d="M-10 150 C 80 120, 150 175, 240 150 S 380 120, 420 140 L 420 190 L -10 190 Z" fill="#aad3f5" />
        <g stroke="#ffffff" strokeLinecap="round" fill="none">
          <path d="M-10 60 L 420 85" strokeWidth="10" />
          <path d="M120 -10 L 150 190" strokeWidth="8" />
          <path d="M300 -10 L 270 190" strokeWidth="6" />
          <path d="M-10 115 L 200 105 L 420 125" strokeWidth="5" />
          <path d="M40 -10 L 60 110" strokeWidth="4" />
        </g>
        <path d="M-10 60 L 420 85" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" />
      </svg>
      {/* your pin, with label */}
      <div className="absolute left-[40%] top-2 flex flex-col items-center">
        <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-800 shadow-md">Your Business <span className="text-amber-500">4.9 ★</span></span>
        <FaLocationDot className="mt-0.5 size-7 text-[#ea4335] drop-shadow-md sm:size-8" />
      </div>
      <div className="absolute left-[8%] top-[58%] flex items-center gap-1">
        <FaLocationDot className="size-5 text-[#ea4335]/70" />
        <span className="text-[10px] font-semibold text-slate-500">Momo Corner</span>
      </div>
      <div className="absolute right-[5%] top-[66%] flex items-center gap-1">
        <FaLocationDot className="size-5 text-[#ea4335]/70" />
        <span className="text-[10px] font-semibold text-slate-500">Tasty Bites</span>
      </div>
      <span className="absolute right-[10%] top-5 hidden text-[10px] font-semibold text-emerald-700 sm:block">Ratna Park</span>
    </div>
  );
}

function MapMock() {
  return (
    <div className="relative mx-auto w-full map-mock max-w-[340px] sm:max-w-[400px]">
      {/* phone */}
      <div className="rounded-[2.5rem] bg-slate-900 p-2.5 shadow-2xl shadow-slate-900/25">
        <div className="overflow-hidden rounded-[2rem] bg-white">
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-slate-800">
            <span>9:41</span>
            <span className="h-4 w-16 rounded-full bg-slate-900" aria-hidden />
            <span className="flex items-center gap-1"><FaSignal className="size-2.5" /><FaWifi className="size-2.5" /><FaBatteryThreeQuarters className="size-3.5" /></span>
          </div>
          {/* search bar */}
          <div className="px-4 pb-3 pt-3">
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-md ring-1 ring-slate-200">
              <FaMagnifyingGlass className="size-3.5 text-slate-500" />
              <span className="flex-1 text-sm text-slate-800">momo near me</span>
              <span className="grid size-7 place-items-center rounded-full bg-blue-900 text-[11px] font-bold text-white">S</span>
            </div>
            <div className="no-scrollbar mt-3 hidden gap-2 overflow-hidden sm:flex">
              {["Open now", "Top rated", "Nearby", "Delivery"].map((c, i) => (
                <span key={c} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${i === 1 ? "bg-blue-50 text-blue-700 ring-blue-200" : "text-slate-600 ring-slate-200"}`}>{c}</span>
              ))}
            </div>
          </div>

          <MapArt />

          {/* results sheet */}
          <div className="-mt-4 relative rounded-t-2xl bg-white pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <span className="mx-auto block h-1 w-9 rounded-full bg-slate-300" />
            <p className="hidden px-5 pt-3 text-xs font-semibold text-slate-500 sm:block">Results</p>
            <ol>
              {MAP_RESULTS.map((r, i) => (
                <li key={r.name} className={`gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 sm:px-5 ${r.you ? "" : "opacity-70"} ${i > 1 ? "hidden sm:flex" : "flex"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <span className="truncate">{r.name}</span>
                      {r.you && <span className="shrink-0 rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-blue-950">#1</span>}
                    </p>
                    <RatingRow rating={r.rating} reviews={r.reviews} strong={r.you} />
                    <p className="mt-0.5 truncate text-[13px] text-slate-500">{r.meta}</p>
                    <p className="text-[13px]"><span className="font-semibold text-emerald-700">Open</span> <span className="text-slate-500">· {r.hours}</span></p>
                    {r.you && (
                      <>
                        <p className="mt-2 hidden items-center gap-2 text-[13px] italic text-slate-600 sm:flex">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold not-italic text-white">A</span>
                          &ldquo;Best jhol momo in town. Staff are so friendly!&rdquo;
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                          <span className="flex items-center gap-1.5 rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white"><FaDiamondTurnRight className="size-3" /> Directions</span>
                          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-slate-200"><FaPhone className="size-2.5" /> Call</span>
                        </div>
                      </>
                    )}
                  </div>
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl sm:size-16 ${r.tint}`}><FaBowlFood className="size-5 sm:size-6" /></span>
                </li>
              ))}
            </ol>
          </div>
          {/* Google Maps style bottom tabs */}
          <div className="grid grid-cols-4 border-t border-slate-100 px-2 pb-3 pt-2 text-center text-[10px] font-semibold text-slate-500">
            {([[FaLocationDot, "Explore"], [FaDiamondTurnRight, "Go"], [FaBookmark, "Saved"], [FaBell, "Updates"]] as const).map(([Icon, label], i) => (
              <span key={label} className={`flex flex-col items-center gap-1 ${i === 0 ? "text-blue-700" : ""}`}>
                <span className={`grid h-6 w-12 place-items-center rounded-full ${i === 0 ? "bg-blue-100" : ""}`}><Icon className="size-3.5" /></span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* floating badges */}
      <div className="hero-float absolute -left-1 top-[118px] hidden sm:flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-xl ring-1 ring-slate-100 sm:-left-16 lg:left-0 xl:-left-16">
        <span className="grid size-10 place-items-center rounded-xl bg-amber-300 text-blue-950"><FaTrophy className="size-4" /></span>
        <span>
          <span className="block text-sm font-extrabold text-slate-900">#1 on Google Maps</span>
          <span className="block text-[11px] text-slate-500">for &ldquo;momo near me&rdquo;</span>
        </span>
      </div>
      <div className="hero-float-slow absolute -right-1 bottom-28 hidden sm:flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-xl ring-1 ring-slate-100 sm:-right-16 lg:right-0 xl:-right-16">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><FaArrowTrendUp className="size-4" /></span>
        <span>
          <span className="block text-sm font-extrabold text-slate-900">+27 reviews</span>
          <span className="block text-[11px] text-slate-500">this month with Give Me Five Star</span>
        </span>
      </div>
    </div>
  );
}

function WhyGoogleReviews() {
  return (
    <section id="why-reviews" className="scroll-mt-28 bg-slate-50 py-12 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 sm:gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Why Google reviews</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Beat your competitors in local search</h2>
          <p className="mt-3 text-base text-slate-600 sm:mt-4 sm:text-lg">Most customers check Google before they visit. More good reviews put you at the top of the map, and in front of them first.</p>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:mt-9 sm:gap-x-6 sm:gap-y-6">
            {WHY.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="grid size-8 place-items-center rounded-lg bg-blue-900 text-amber-300 sm:size-10"><Icon className="size-3.5 sm:size-4" /></span>
                <p className="mt-2 text-sm font-bold leading-snug text-slate-900 sm:mt-3 sm:text-base">{title}</p>
                <p className="mt-1 hidden text-sm leading-relaxed text-slate-600 sm:block">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <MapMock />
      </div>
    </section>
  );
}

// ---------- How it works ----------
function StepArt({ step }: { step: number }) {
  const tile = "relative grid h-40 place-items-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100";
  if (step === 1) return (
    <div className={tile}>
      <div className="relative rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-100">
        <FaQrcode className="size-16 text-blue-950" />
        <span className="scan-line absolute inset-x-2 top-3 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" />
      </div>
    </div>
  );
  if (step === 2) return (
    <div className={tile}>
      <div className="w-40 rounded-xl bg-white p-3 text-center shadow-md ring-1 ring-slate-100">
        <span className="flex justify-center gap-1">{[1, 2, 3, 4, 5].map((i) => <FaStar key={i} className="size-4 text-amber-400" />)}</span>
        <span className="mt-2.5 block rounded-lg bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100">Chicken momo</span>
      </div>
    </div>
  );
  if (step === 3) return (
    <div className={tile}>
      <div className="w-44 rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-100">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600"><FaWandMagicSparkles className="size-3" /> Writing…</span>
        <span className="mt-2 block h-1.5 w-full rounded-full bg-slate-200" />
        <span className="mt-1.5 block h-1.5 w-11/12 rounded-full bg-slate-200" />
        <span className="type-bar mt-1.5 block h-1.5 rounded-full bg-blue-900" />
      </div>
    </div>
  );
  return (
    <div className={tile}>
      <div className="w-44 rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-100">
        <span className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-slate-100"><FaGoogle className="size-3.5 text-blue-600" /></span>
          <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <FaStar key={i} className="size-2.5 text-amber-400" />)}</span>
        </span>
        <span className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-bold text-emerald-700"><FaCircleCheck className="size-3" /> Posted on Google</span>
      </div>
    </div>
  );
}

const HOW = [
  { title: "Scan the QR", text: "Your customer scans the code on the table, counter or bill. No app needed." },
  { title: "Rate the visit", text: "They tap the stars and type what they bought or tried. Takes seconds." },
  { title: "AI writes it", text: "An honest review that matches their rating is ready in about 3 seconds." },
  { title: "Post on Google", text: "One tap copies it and opens your Google page. They paste and post." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Heading eyebrow="How it works" title="From scan to 5 stars in under a minute" text="Four easy steps for your customer. Nothing to install, nothing to type from scratch." />
        <ol className="relative mt-10 grid gap-6 sm:mt-16 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-6">
          {/* dashed line joining the steps */}
          <span aria-hidden className="absolute left-[12%] right-[12%] top-[159px] hidden border-t-2 border-dashed border-slate-200 lg:block" />
          {HOW.map(({ title, text }, i) => (
            <li key={title} className="relative flex gap-4 text-left sm:block sm:text-center">
              <div className="hidden sm:block"><StepArt step={i + 1} /></div>
              <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-amber-300 text-sm font-extrabold text-blue-950 shadow-md ring-4 ring-white sm:mx-auto sm:-mt-5">{i + 1}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 sm:mt-4">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:mx-auto sm:mt-2 sm:max-w-60">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl bg-blue-950 px-6 py-5 sm:mt-14 text-center text-white sm:justify-between sm:text-left">
          <p className="flex items-center gap-3 text-sm"><FaChartColumn className="size-5 shrink-0 text-amber-300" /> <span><b>And for you:</b> every visit, rating and customer lands in your dashboard.</span></p>
          <AuthButton className="flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-bold text-blue-950 hover:bg-amber-200">Try it free <FaArrowRight className="size-3" /></AuthButton>
        </div>
      </div>
    </section>
  );
}

// ---------- 1. Features ----------
const FEATURES: { id?: string; Icon: IconType; title: string; text: string }[] = [
  { id: "ai-reviews", Icon: FaWandMagicSparkles, title: "AI writes the review", text: "Customers pick a star rating and the AI writes an honest review for them." },
  { id: "qr-codes", Icon: FaQrcode, title: "Your own QR code", text: "Put it on tables, bills or receipts, or share the link on WhatsApp." },
  { id: "insights", Icon: FaChartColumn, title: "Customer insights", text: "See who visited, what they bought and how they rated you." },
  { Icon: FaLanguage, title: "Multiple languages", text: "Reviews in English, Nepali or a natural mix of both." },
  { Icon: FaCommentDots, title: "Private feedback", text: "Collect honest ratings and details without asking for a review." },
  { Icon: FaHashtag, title: "Local keywords", text: "Add words like your area and the AI uses them naturally." },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-28 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Heading eyebrow="Features" title="Everything you need to win more reviews" text="Simple for your customers, simple for you." />
        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map(({ id, Icon, title, text }) => (
            <article key={title} id={id} className="flex scroll-mt-32 gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:block sm:p-7">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-900 text-amber-300 sm:size-12"><Icon className="size-5" /></span>
              <div>
                <h3 className="font-bold text-slate-900 sm:mt-5 sm:text-lg">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:mt-2 sm:text-base">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- 3. Why businesses choose us ----------
const LOCAL: { Icon: IconType; title: string; text: string }[] = [
  { Icon: FaGlobe, title: "Works in any country", text: "Any business with a Google profile can start in minutes." },
  { Icon: FaLanguage, title: "Reviews that sound real", text: "Written in the language and tone your customers use." },
  { Icon: FaMoneyBillWave, title: "Fair, simple pricing", text: "Simple monthly plans, and a free plan to start." },
  { Icon: FaWhatsapp, title: "Real human support", text: "Real people on WhatsApp who reply in hours, not days." },
  { Icon: FaWallet, title: "No card needed", text: "Start free and upgrade only when you are ready." },
  { Icon: FaMobileScreen, title: "Works on any phone", text: "Customers need no app. Just scan and tap." },
];

function WhyUs() {
  return (
    <section className="bg-blue-950 py-16 text-white sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Why Give Me Five Star</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Built for local businesses, wherever you are</h2>
          <p className="mt-4 text-lg text-blue-100/85">Cafés, salons, clinics, hotels and shops around the world use one QR code to turn happy visits into Google reviews.</p>
          <div className="mt-8 flex items-center gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-300"><FaShieldHalved className="size-5" /></span>
            <p className="text-sm text-blue-100">Every payment is checked by a real person on our team, and your customer data stays yours.</p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {LOCAL.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 sm:block sm:p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-300 text-blue-950"><Icon className="size-4" /></span>
              <div>
                <p className="font-bold sm:mt-4">{title}</p>
                <p className="mt-0.5 text-sm text-blue-100/80 sm:mt-1">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- 4. About us ----------
const VALUES: { Icon: IconType; title: string; text: string }[] = [
  { Icon: FaHandshake, title: "Honest, always", text: "Real ratings from real visits. Never fake reviews." },
  { Icon: FaHeart, title: "Simple for everyone", text: "No apps, no jargon. Scan, tap, done." },
  { Icon: FaLocationDot, title: "Local at heart", text: "Built for neighbourhood businesses, with a team that answers on WhatsApp." },
];

function About() {
  return (
    <section id="about" className="scroll-mt-28 border-t border-slate-100 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Heading eyebrow="About us" title="We help local businesses get the credit they deserve"
          text="The world is full of great shops, cafés and clinics with only a few Google reviews. Customers are happy, they just don't know what to write. Give Me Five Star makes it take seconds." />
        <ul className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-5">
          {VALUES.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-slate-50 p-7 text-center ring-1 ring-slate-100">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-blue-950 text-amber-300"><Icon className="size-5" /></span>
              <p className="mt-5 font-bold text-slate-900">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- 5. Final call to action ----------
function FinalCta() {
  return (
    <section className="bg-amber-300 py-14 text-blue-950 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your next 5-star review is one scan away</h2>
          <p className="mt-3 text-lg text-blue-950/80">Set up your QR code in 2 minutes. Free forever plan, no card needed.</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-center gap-3">
          <AuthButton className="flex items-center gap-2 rounded-lg bg-blue-950 px-7 py-4 font-bold text-white shadow-lg transition hover:bg-blue-900">
            Start free <FaArrowRight className="size-3.5" />
          </AuthButton>
          <a href="#pricing" className="flex items-center gap-2 rounded-lg px-6 py-4 font-bold ring-2 ring-blue-950/20 transition hover:bg-blue-950/5">See pricing</a>
        </div>
      </div>
    </section>
  );
}

export default async function HomeSections() {
  const { support } = await getPlatform();
  return (
    <>
      <NumbersBand />
      <BrandStrip />
      <WhyGoogleReviews />
      <HowItWorks />
      <Features />
      <WhyUs />
      <Solutions />
      <Testimonials />
      <About />
      <PricingSection />
      <ContactSection support={support} />
      <FinalCta />
    </>
  );
}
