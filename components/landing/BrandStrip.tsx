// "Brands we've worked with" strip under the hero; logos come from Admin > Content > Logos, hidden when there are none
import { db } from "@/lib/db";

export default async function BrandStrip() {
  const logos = await db.brandLogo.findMany({ where: { published: true }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }], omit: { logo: true } });
  if (!logos.length) return null;
  return (
    <section aria-label="Brands we've worked with" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-8 border-y border-slate-200 py-8 lg:flex-row lg:gap-10">
          <p className="shrink-0 text-center text-lg font-semibold leading-snug text-slate-800 lg:w-44 lg:border-r lg:border-slate-200 lg:pr-10 lg:text-left">
            Brands we&apos;ve worked with
          </p>
          <ul className="flex flex-1 flex-wrap items-center justify-center gap-x-12 gap-y-6 lg:justify-between">
            {logos.map((l) => {
              const img = <img src={`/api/img/brand/${l.id}?v=${l.logoAt.getTime()}`} alt={l.name} loading="lazy" className="h-10 w-auto max-w-36 object-contain sm:h-12" />;
              return (
                <li key={l.id} title={l.name}>
                  {l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="block transition hover:opacity-75">{img}</a> : img}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
