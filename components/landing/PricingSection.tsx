// Pricing section of the one-page home: plans, AI review top-ups, ads, comparison and FAQ
import {
  FaBolt, FaBullhorn, FaCheck, FaMinus, FaChevronDown, FaWallet, FaBuildingColumns, FaShieldHalved, FaCircleCheck,
} from "react-icons/fa6";
import PlanCards from "@/components/landing/PlanCards";
import AuthButton from "@/components/auth/AuthButton";
import { getCurrentUser } from "@/lib/auth";
import { enabledMethods, getPlatform } from "@/lib/platform";
import { creditPacks, isBank, plans, site } from "@/lib/site";
import { npr } from "@/components/ui/PaymentMethods";


// what each plan includes, row by row
const COMPARE: { label: string; values: (string | boolean)[] }[] = [
  { label: "AI-written reviews per month", values: plans.map((p) => (p.reviews === null ? "Unlimited" : p.reviews.toLocaleString())) },
  { label: "Customers in your list", values: plans.map((p) => (p.customers === null ? "Unlimited" : `Up to ${p.customers}`)) },
  { label: "Review link & QR code", values: [true, true, true] },
  { label: "Customer list & filters", values: [true, true, true] },
  { label: "Feedback-only page mode", values: [true, true, true] },
  { label: "No Give Me Five Star badge on your page", values: [false, true, true] },
  { label: "Your colours & photo on the review page", values: [false, true, true] },
  { label: "Custom AI instructions", values: [false, true, true] },
  { label: "CSV import & export", values: [false, true, true] },
  { label: "Detailed review insights", values: [false, false, true] },
  { label: "Support", values: ["Email", "Priority WhatsApp", "Dedicated manager"] },
];

const FAQ = [
  { q: "Is the Free plan really free?", a: "Yes. You get 5 AI-written reviews every month, up to 5 customers in your list, and your own review link and QR code. No card needed and no time limit." },
  { q: "What counts as one AI review?", a: "Each time a customer rates their visit and the AI writes review options for them, one credit is used. Feedback-only responses don't use credits." },
  { q: "How do I pay?", a: "Pay with eSewa, Khalti or bank transfer and upload the payment screenshot in your dashboard. Our team confirms it within a few hours and your plan starts right away." },
  { q: "Can I change or cancel my plan?", a: "Any time. Upgrade when you need more reviews. If a paid plan isn't renewed, you simply move back to Free and keep your data." },
  { q: "Are the reviews honest?", a: "The AI writes from the customer's own star rating and what they bought, so a 3-star visit gets a 3-star review. Customers can edit before posting, and they post it themselves." },
  { q: "What happens when I run out of AI reviews?", a: "Buy a top-up pack from your dashboard. It never expires. You can also switch the page to feedback-only mode, which needs no credits. On the Business plan AI reviews are unlimited." },
  { q: "What happens to customers above the Free limit?", a: "Nothing is deleted. Every customer is saved; the Free plan just shows your newest 5. Upgrade to Pro and your full list appears instantly." },
];

const Cell = ({ v, featured }: { v: string | boolean; featured: boolean }) =>
  typeof v === "string" ? <span className={`font-semibold ${featured ? "text-blue-900" : "text-slate-800"}`}>{v}</span>
  : v ? <FaCheck className={`mx-auto size-4 ${featured ? "text-blue-900" : "text-emerald-600"}`} aria-label="Included" />
  : <FaMinus className="mx-auto size-3.5 text-slate-300" aria-label="Not included" />;

export default async function PricingSection() {
  const [user, platform] = await Promise.all([getCurrentUser(), getPlatform()]);
  const dashboardHref = user ? (user.role === "super_admin" ? "/admin" : "/dashboard/settings?tab=subscription") : null;
  const methods = enabledMethods(platform);

  return (
    <div id="pricing" className="scroll-mt-20 bg-slate-50 pb-24">
        {/* Title + plans (cards overlap the navy band) */}
        <section className="bg-blue-950 pb-44 pt-16 text-white sm:pt-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Pricing</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Simple, honest pricing</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-blue-100/90">Start free with 5 AI reviews a month. Upgrade only when your reviews start pouring in.</p>
          </div>
        </section>
        <div className="mx-auto -mt-32 max-w-6xl px-4">
          <div className="-mt-4 mb-2"><PlanCards dashboardHref={dashboardHref} /></div>
          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {["No setup fee", "Cancel anytime", "Prices include everything shown"].map((t) => (
              <span key={t} className="flex items-center gap-2"><FaCircleCheck className="size-3.5 text-emerald-500" /> {t}</span>
            ))}
          </p>
        </div>

        {/* Top-ups + Ads */}
        <section className="mx-auto mt-20 grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><FaBolt className="size-4" /></span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Need more AI reviews?</h2>
                <p className="mt-0.5 text-sm text-slate-500">Ran out on Pro? Top up any time. Top-ups never expire.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {creditPacks.map((c) => (
                <div key={c.id} className={`relative rounded-lg border-2 p-4 text-center ${c.popular ? "border-blue-900 bg-blue-50/40" : "border-slate-200"}`}>
                  {c.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Best value</span>}
                  <p className="text-2xl font-extrabold text-slate-900">{c.reviews.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">AI reviews</p>
                  <p className="mt-3 font-bold text-slate-900">{npr(c.price)}</p>
                  <p className="text-[11px] text-slate-400">Rs {(c.price / c.reviews).toFixed(1)} per review</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-blue-950 p-7 text-white shadow-sm">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300"><FaBullhorn className="size-4" /></span>
              <div>
                <h2 className="text-lg font-bold">Review ads</h2>
                <p className="mt-0.5 text-sm text-blue-200">We bring new visitors who leave reviews for you.</p>
              </div>
            </div>
            <p className="mt-6 flex items-end gap-1.5"><span className="text-4xl font-extrabold">{npr(platform.adPrice)}</span><span className="pb-1.5 text-sm text-blue-200">/ delivered review</span></p>
            <ul className="mt-5 space-y-2 text-sm text-blue-100">
              <li className="flex gap-2"><FaCheck className="mt-1 size-3 shrink-0 text-amber-300" /> Pay only for reviews delivered</li>
              <li className="flex gap-2"><FaCheck className="mt-1 size-3 shrink-0 text-amber-300" /> {platform.adMin.toLocaleString()} to {platform.adMax.toLocaleString()} reviews per order</li>
              <li className="flex gap-2"><FaCheck className="mt-1 size-3 shrink-0 text-amber-300" /> Delivery usually starts within 24–48 hours</li>
            </ul>
          </div>
        </section>

        {/* Comparison */}
        <section className="mx-auto mt-20 max-w-6xl px-4">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Compare plans</h2>
          <div className="no-scrollbar mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-5 text-left font-semibold text-slate-500">Features</th>
                  {plans.map((p) => (
                    <th key={p.id} className={`w-1/5 px-4 py-5 text-center ${p.popular ? "bg-blue-50/60" : ""}`}>
                      <span className="block text-base font-bold text-slate-900">{p.name}</span>
                      <span className="block text-xs font-medium text-slate-500">{p.price ? `${npr(p.price)} / month` : "Free"}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARE.map((row) => (
                  <tr key={row.label}>
                    <td className="px-6 py-4 text-slate-700">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className={`px-4 py-4 text-center ${plans[i].popular ? "bg-blue-50/60" : ""}`}><Cell v={v} featured={!!plans[i].popular} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment + FAQ */}
        <section className="mx-auto mt-20 grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pay the way you already do</h2>
            <p className="mt-3 text-slate-600">No card needed. Pay by mobile wallet or bank transfer and upload the screenshot. We confirm it within a few hours.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {methods.map((m) => (
                <span key={m.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
                  {isBank(m) ? <FaBuildingColumns className="size-3.5 text-slate-400" /> : <FaWallet className="size-3.5 text-slate-400" />} {m.label}
                </span>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><FaShieldHalved className="size-3.5 text-emerald-500" /> Every payment is checked by a real person on our team.</p>
          </div>

          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {q}
                  <FaChevronDown className="size-3 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>

    </div>
  );
}
