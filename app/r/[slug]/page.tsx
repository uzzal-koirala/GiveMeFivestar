// Public page customers reach from the QR code / review link
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ReviewFlow from "@/components/review/ReviewFlow";
import { detailsMode } from "@/lib/details-mode";
import { reviewPageStatus } from "@/lib/data";
import { activePlan, canDesignPage } from "@/lib/site";
import { FaCirclePause, FaPhone, FaWhatsapp, FaGlobe, FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";

type Props = { params: Promise<{ slug: string }> };

const getLink = (slug: string) =>
  db.reviewLink.findUnique({ where: { slug }, omit: { bgImage: true }, include: { user: { select: { id: true, phone: true, avatarAt: true, suspended: true, plan: true, planExpiresAt: true } } } });

// products the owner added during setup (stored as a JSON array)
const parseProducts = (raw: string): string[] => {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  } catch {
    return [];
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = await getLink((await params).slug);
  return { title: link ? `Review ${link.businessName}` : "Review link not found" };
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const link = await getLink(slug);
  if (!link) notFound();
  const { user } = link;
  const paid = canDesignPage(activePlan(user.plan, user.planExpiresAt)); // Pro or Business still active
  const logoUrl = user.avatarAt ? `/api/avatar/${user.id}?v=${user.avatarAt.getTime()}` : null;
  const status = link.user.suspended ? { open: false } : await reviewPageStatus(user.id, link.collectOnly);

  // suspended, or the plan has no reviews left: a friendly "not now" instead of the form
  if (!status.open) {
    const phone = (user.phone ?? "").replace(/\D/g, "");
    const contacts = [
      phone && { href: `tel:${user.phone}`, label: "Call", Icon: FaPhone, cls: "bg-blue-900" },
      phone && { href: `https://wa.me/${phone}`, label: "WhatsApp", Icon: FaWhatsapp, cls: "bg-emerald-600" },
      link.websiteUrl && { href: link.websiteUrl, label: "Website", Icon: FaGlobe, cls: "bg-blue-700" },
      link.facebookUrl && { href: link.facebookUrl, label: "Facebook", Icon: FaFacebookF, cls: "bg-[#1877F2]" },
      link.instagramUrl && { href: link.instagramUrl, label: "Instagram", Icon: FaInstagram, cls: "bg-[#E4405F]" },
      link.tiktokUrl && { href: link.tiktokUrl, label: "TikTok", Icon: FaTiktok, cls: "bg-black" },
    ].filter(Boolean) as { href: string; label: string; Icon: typeof FaPhone; cls: string }[];
    return (
      <main className="min-h-dvh bg-slate-100">
        <div className="bg-blue-950 px-6 pb-20 pt-12 text-center text-white">
          {logoUrl
            ? <img src={logoUrl} alt="" className="mx-auto size-16 rounded-2xl object-cover shadow-lg ring-4 ring-white/10" />
            : <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-xl font-extrabold text-blue-950 shadow-lg">{link.businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>}
          <h1 className="mt-4 text-xl font-bold">{link.businessName}</h1>
        </div>
        <div className="mx-auto -mt-12 max-w-sm px-4 pb-10">
          <div className="rounded-2xl bg-white p-7 text-center shadow-xl shadow-slate-900/5">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100 text-amber-600 ring-8 ring-amber-50"><FaCirclePause className="size-7" /></span>
            <h2 className="mt-5 text-lg font-bold text-slate-900">Not accepting reviews right now</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {link.businessName} can&apos;t receive new reviews at the moment. Thank you for wanting to share your experience. Please let the staff know, or try again later.
            </p>
            {contacts.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {contacts.map(({ href, label, Icon, cls }) => (
                  <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" aria-label={label} title={label}
                    className={`grid size-11 place-items-center rounded-full text-white transition hover:-translate-y-0.5 ${cls}`}><Icon className="size-4" /></a>
                ))}
              </div>
            )}
          </div>
          {!paid && <a href="/?ref=review-badge" className="mt-6 block text-center text-xs text-slate-400 hover:text-slate-600">Powered by Give Me Five Star · Get your own review page</a>}
        </div>
      </main>
    );
  }

  return (
    <ReviewFlow
      slug={link.slug}
      businessName={link.businessName}
      description={link.description}
      phone={user.phone ?? ""}
      logoUrl={logoUrl}
      googleReviewUrl={link.googleReviewUrl}
      products={parseProducts(link.products)}
      detailsMode={link.collectOnly ? "required" : detailsMode(link)}
      collectOnly={link.collectOnly}
      socials={{ website: link.websiteUrl, facebook: link.facebookUrl, instagram: link.instagramUrl, tiktok: link.tiktokUrl }}
      branded={!paid}
      theme={paid
        ? { color: link.themeColor, imageUrl: link.bgImageAt ? `/api/review-bg/${link.slug}?v=${link.bgImageAt.getTime()}` : null }
        : undefined}
    />
  );
}
