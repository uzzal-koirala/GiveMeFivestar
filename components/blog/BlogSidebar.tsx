// Blog sidebar (news style): search, topics with counts, most recent, and a call to action
import Link from "next/link";
import { FaMagnifyingGlass, FaHashtag, FaArrowRight, FaQrcode } from "react-icons/fa6";
import AuthButton from "@/components/auth/AuthButton";

export type SidebarPost = { slug: string; title: string; date: Date };

export function SearchBox({ q = "", className = "" }: { q?: string; className?: string }) {
  return (
    <form action="/blog" role="search" className={`flex items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-600 ${className}`}>
      <FaMagnifyingGlass className="size-3.5 shrink-0 text-slate-400" />
      <input name="q" defaultValue={q} type="search" placeholder="Search articles…" aria-label="Search articles" className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
    </form>
  );
}

const box = "rounded-xl border border-slate-200 bg-white p-5";
const heading = "flex items-center gap-2 border-b-2 border-blue-950 pb-2 text-xs font-extrabold uppercase tracking-[0.15em] text-blue-950";

export default function BlogSidebar({ q, topics, recent, current }: { q?: string; topics: [string, number][]; recent: SidebarPost[]; current?: string }) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
      <div className={box}>
        <p className={heading}>Search</p>
        <SearchBox q={q} className="mt-4" />
      </div>

      {topics.length > 0 && (
        <div className={box}>
          <p className={heading}>Topics</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {topics.map(([t, n]) => (
              <li key={t}>
                <Link href={`/blog?tag=${encodeURIComponent(t)}`} className={`flex items-center justify-between py-2.5 text-sm transition hover:text-blue-800 ${current === t ? "font-bold text-blue-800" : "text-slate-700"}`}>
                  <span className="flex items-center gap-2"><FaHashtag className="size-3 text-amber-500" /> {t}</span>
                  <span className="rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-500">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recent.length > 0 && (
        <div className={box}>
          <p className={heading}>Most recent</p>
          <ol className="mt-3 space-y-4">
            {recent.map((p, i) => (
              <li key={p.slug} className="flex gap-3">
                <span className="text-2xl font-extrabold leading-none text-slate-200">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <Link href={`/blog/${p.slug}`} className="text-sm font-semibold leading-snug text-slate-900 hover:text-blue-800">{p.title}</Link>
                  <time dateTime={p.date.toISOString()} className="mt-1 block text-xs text-slate-400">{p.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-xl bg-blue-950 p-6 text-white">
        <span className="grid size-11 place-items-center rounded-lg bg-amber-300 text-blue-950"><FaQrcode className="size-5" /></span>
        <p className="mt-4 text-lg font-bold leading-snug">Get more Google reviews, the easy way</p>
        <p className="mt-2 text-sm text-blue-100/80">One QR code, AI writing help, and a dashboard for every review.</p>
        <AuthButton className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 py-2.5 text-sm font-bold text-blue-950 hover:bg-amber-200">
          Start free <FaArrowRight className="size-3" />
        </AuthButton>
      </div>
    </aside>
  );
}
