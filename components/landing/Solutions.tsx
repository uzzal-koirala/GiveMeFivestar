"use client";

// Solutions: business types in an endless, auto-scrolling row. Pauses on hover/touch; arrows or swipe to browse.
import { useEffect, useRef } from "react";
import type { IconType } from "react-icons";
import {
  FaUtensils, FaScissors, FaBagShopping, FaStethoscope, FaHotel, FaTractor, FaDumbbell, FaGraduationCap,
  FaCarSide, FaMountainSun, FaPrescriptionBottleMedical, FaCakeCandles, FaChevronLeft, FaChevronRight,
} from "react-icons/fa6";

const SOLUTIONS: { id: string; Icon: IconType; tint: string; title: string; text: string; tags: string[] }[] = [
  { id: "restaurants", Icon: FaUtensils, tint: "bg-amber-100 text-amber-700", title: "Restaurants & Cafés", text: "A QR on every table turns a good meal into a Google review before the bill arrives.", tags: ["Taste", "Service", "Ambience"] },
  { id: "salons", Icon: FaScissors, tint: "bg-rose-100 text-rose-600", title: "Salons & Spas", text: "Catch customers while they love their new look, right at the mirror or the counter.", tags: ["Stylist", "Hygiene", "Result"] },
  { id: "retail", Icon: FaBagShopping, tint: "bg-blue-100 text-blue-800", title: "Retail Stores", text: "Put the QR at checkout and on receipts so happy shoppers help new ones find you.", tags: ["Products", "Price", "Staff"] },
  { id: "clinics", Icon: FaStethoscope, tint: "bg-emerald-100 text-emerald-700", title: "Clinics", text: "Build trust with patients through honest, calm reviews about care and waiting time.", tags: ["Doctor", "Care", "Waiting time"] },
  { id: "hotels", Icon: FaHotel, tint: "bg-indigo-100 text-indigo-700", title: "Hotels & Homestays", text: "Leave a QR in the room or at checkout and guests review their stay before they leave.", tags: ["Room", "Breakfast", "Hosts"] },
  { id: "farmhouses", Icon: FaTractor, tint: "bg-lime-100 text-lime-700", title: "Resorts & Farmhouses", text: "Turn a peaceful day out into reviews that bring the next family weekend to you.", tags: ["Nature", "Food", "Activities"] },
  { id: "gyms", Icon: FaDumbbell, tint: "bg-orange-100 text-orange-700", title: "Gyms & Fitness", text: "Members who hit their goals are your best advertising. Let them say it on Google.", tags: ["Trainers", "Equipment", "Clean"] },
  { id: "education", Icon: FaGraduationCap, tint: "bg-sky-100 text-sky-700", title: "Institutes & Classes", text: "Happy students and parents help new learners pick your classes with confidence.", tags: ["Teachers", "Results", "Fees"] },
  { id: "auto", Icon: FaCarSide, tint: "bg-slate-200 text-slate-700", title: "Workshops & Garages", text: "A quick review after a smooth repair builds the trust every garage needs.", tags: ["Repair", "Honest price", "Speed"] },
  { id: "travel", Icon: FaMountainSun, tint: "bg-teal-100 text-teal-700", title: "Travel & Trekking", text: "Guests back from the trail are full of stories. Help them share them on Google.", tags: ["Guide", "Planning", "Safety"] },
  { id: "pharmacy", Icon: FaPrescriptionBottleMedical, tint: "bg-red-100 text-red-600", title: "Pharmacies", text: "Friendly advice and fair prices deserve to be found by people nearby.", tags: ["Stock", "Advice", "Price"] },
  { id: "bakery", Icon: FaCakeCandles, tint: "bg-pink-100 text-pink-600", title: "Bakeries & Sweets", text: "Birthday cakes and fresh sel roti make people smile. Turn that into stars.", tags: ["Taste", "Freshness", "Design"] },
];

const SPEED = 0.5; // px per frame, about 30px a second
// width of one full copy of the list (it is rendered twice for a seamless loop)
const loopWidth = (el: HTMLElement) => (el.children[SOLUTIONS.length] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;

export default function Solutions() {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const slide = useRef<{ from: number; to: number; t0: number } | null>(null); // arrow animation, run by the same loop
  const running = useRef(false);

  useEffect(() => {
    const el = track.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    running.current = true;
    let pos = el.scrollLeft, raf = 0;
    const tick = () => {
      if (slide.current) {
        const { from, to, t0 } = slide.current;
        const k = Math.min(1, (performance.now() - t0) / 450);
        pos = from + (to - from) * (1 - (1 - k) ** 3); // ease-out
        if (k === 1) slide.current = null;
        el.scrollLeft = pos;
      } else {
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft; // user swiped
        if (!paused.current) {
          pos += SPEED;
          if (pos >= loopWidth(el)) pos -= loopWidth(el);
          el.scrollLeft = pos;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { running.current = false; cancelAnimationFrame(raf); };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const d = (el.firstElementChild as HTMLElement).offsetWidth + 20; // card + gap
    const half = loopWidth(el);
    let from = el.scrollLeft;
    // hop to the identical spot in the other copy so we never hit either end
    if (dir === -1 && from - d < 0) from += half;
    if (dir === 1 && from + d > half) from -= half;
    const to = from + dir * d;
    if (running.current) slide.current = { from, to, t0: performance.now() };
    else el.scrollLeft = to;
  };

  const hold = (on: boolean) => () => { paused.current = on; };

  return (
    <section id="solutions" onMouseEnter={hold(true)} onMouseLeave={hold(false)} className="scroll-mt-28 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Solutions</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Made for the businesses people review</h2>
            <p className="mt-4 text-lg text-slate-600">Wherever customers visit you in person, Give Me Five Star turns their good experience into a review.</p>
          </div>
          <div className="flex gap-2">
            {([[-1, FaChevronLeft, "Previous"], [1, FaChevronRight, "Next"]] as const).map(([d, Icon, label]) => (
              <button key={label} type="button" onClick={() => step(d)} aria-label={label}
                className="grid size-11 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-900 hover:bg-blue-900 hover:text-white">
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={track}

        onTouchStart={hold(true)} onTouchEnd={() => setTimeout(hold(false), 2500)}
        onFocus={hold(true)} onBlur={hold(false)}
        className="no-scrollbar mt-8 flex sm:mt-10 gap-5 overflow-x-auto px-4 pb-6 pt-2 sm:px-[max(1rem,calc((100vw-80rem)/2+1rem))]"
      >
        {[0, 1].map((copy) =>
          SOLUTIONS.map(({ id, Icon, tint, title, text, tags }) => (
            <article key={`${copy}-${id}`} id={copy ? undefined : id} aria-hidden={copy === 1 || undefined}
              className="group w-[280px] shrink-0 scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
              <span className={`grid size-12 place-items-center rounded-xl ${tint}`}><Icon className="size-5" /></span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Customers mention</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{t}</span>)}
              </div>
            </article>
          )),
        )}
      </div>
    </section>
  );
}
