// "What our clients say": only testimonials the super admin has published
import { FaQuoteLeft, FaStar } from "react-icons/fa6";
import { db } from "@/lib/db";
import { colorFor } from "@/components/dashboard/CustomersTable";

const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// Generated examples, shown (and labelled) only until the super admin publishes real testimonials
const EXAMPLES = [
  { id: "ex1", name: "Sita G.", role: "Owner", business: "Café", city: "Pokhara", rating: 5, photoAt: null,
    quote: "Customers used to say they'd leave a review and never did. Now they scan the QR at the table and it's done before the bill comes." },
  { id: "ex2", name: "Ramesh K.", role: "Manager", business: "Salon & spa", city: "Kathmandu", rating: 5, photoAt: null,
    quote: "The reviews sound like our customers, in Nepali and English. We moved up on Google Maps for 'salon near me' within weeks." },
  { id: "ex3", name: "Anita S.", role: "Owner", business: "Farmhouse stay", city: "Dhulikhel", rating: 5, photoAt: null,
    quote: "Guests love how quick it is. The dashboard shows me what they enjoyed most, so I know what to keep doing." },
];

export default async function Testimonials() {
  const real = await db.testimonial.findMany({ where: { published: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }], take: 6, omit: { photo: true } });
  const examples = !real.length;
  const items = examples ? EXAMPLES : real;
  return (
    <section id="testimonials" className="scroll-mt-28 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">What our clients say</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{examples ? "Built for local businesses everywhere" : "Loved by local businesses"}</h2>
          <p className="mt-4 text-lg text-slate-600">
            {examples ? "How owners use Give Me Five Star to turn happy customers into Google reviews." : "Real words from owners who turned happy customers into Google reviews."}
          </p>
          {examples && <p className="mt-3 inline-block rounded-full bg-slate-200/70 px-3 py-1 text-xs font-medium text-slate-500">Example stories · real client reviews coming soon</p>}
        </div>
        <ul className={`no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:mt-14 md:mx-0 md:grid md:gap-6 md:overflow-visible md:px-0 md:pb-0 ${items.length === 1 ? "mx-auto max-w-xl" : items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {items.map((t, i) => (
            <li key={t.id} className={`relative flex w-[85%] shrink-0 snap-center flex-col rounded-2xl p-6 shadow-sm sm:w-[60%] sm:p-7 md:w-auto ${i === 1 && items.length >= 3 ? "bg-blue-900 text-white shadow-xl shadow-blue-950/20 lg:-translate-y-4" : "border border-slate-200 bg-white"}`}>
              <FaQuoteLeft className={`size-8 ${i === 1 && items.length >= 3 ? "text-amber-300" : "text-blue-100"}`} />
              <span className="mt-4 flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <FaStar key={n} className={`size-4 ${n <= t.rating ? "text-amber-400" : "text-slate-200"}`} />)}</span>
              <blockquote className={`mt-4 flex-1 text-[17px] leading-relaxed ${i === 1 && items.length >= 3 ? "text-blue-50" : "text-slate-700"}`}>&ldquo;{t.quote}&rdquo;</blockquote>
              <figure className="mt-6 flex items-center gap-3 border-t border-current/10 pt-5">
                {t.photoAt
                  ? <img src={`/api/img/testimonial/${t.id}?v=${t.photoAt.getTime()}`} alt="" className="size-12 rounded-full object-cover ring-2 ring-white" />
                  : <span className={`grid size-12 place-items-center rounded-full text-sm font-bold text-white ${colorFor(t.name)}`}>{initials(t.name)}</span>}
                <figcaption className="min-w-0">
                  <span className="block truncate font-bold">{t.name}</span>
                  <span className={`block truncate text-sm ${i === 1 && items.length >= 3 ? "text-blue-200" : "text-slate-500"}`}>{[t.role, t.business].filter(Boolean).join(", ")}{t.city && ` · ${t.city}`}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
