// Tiny, safe formatter for blog posts and job descriptions (no raw HTML ever reaches the page).
// Supports: "## Heading", "### Subheading", "- list item", "1. numbered item", "> quote", **bold**, [text](https://link), blank line = new paragraph.
import { Fragment } from "react";

function inline(text: string, key: string) {
  // split into **bold** and [text](url) pieces; everything else stays plain text
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return parts.map((p, i) => {
    const k = `${key}-${i}`;
    const bold = p.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={k} className="font-bold text-slate-900">{bold[1]}</strong>;
    const link = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link && /^(https?:\/\/|\/|#|mailto:)/.test(link[2])) {
      const external = link[2].startsWith("http");
      return <a key={k} href={link[2]} {...(external && { target: "_blank", rel: "noopener noreferrer" })} className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-700">{link[1]}</a>;
    }
    return <Fragment key={k}>{p}</Fragment>;
  });
}

// group consecutive lines of the same kind, so a heading or list needs no blank line around it
const kindOf = (l: string) => (/^#{2,3} /.test(l) ? "h" : /^[-*] /.test(l) ? "ul" : /^\d+\. /.test(l) ? "ol" : l.startsWith("> ") ? "q" : "p");
function toBlocks(text: string) {
  const out: string[][] = [];
  let prev = "";
  for (const l of text.replace(/\r/g, "").split("\n").map((x) => x.trim())) {
    const k = l ? kindOf(l) : "";
    if (k && k === prev && k !== "h") out[out.length - 1].push(l);
    else if (k) out.push([l]);
    prev = k;
  }
  return out.map((ls) => ls.join("\n"));
}

export function RichText({ text }: { text: string }) {
  const blocks = toBlocks(text);
  return (
    <div className="space-y-5 text-[17px] leading-8 text-slate-700">
      {blocks.map((b, i) => {
        const k = String(i);
        if (b.startsWith("### ")) return <h3 key={k} className="pt-2 text-xl font-bold text-slate-900">{inline(b.slice(4), k)}</h3>;
        if (b.startsWith("## ")) return <h2 key={k} id={b.slice(3).toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="scroll-mt-28 pt-4 text-2xl font-extrabold tracking-tight text-slate-900">{inline(b.slice(3), k)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l)))
          return <ul key={k} className="space-y-2 pl-1">{lines.map((l, j) => <li key={j} className="flex gap-3"><span className="mt-3 size-1.5 shrink-0 rounded-full bg-amber-400" />{<span>{inline(l.slice(2), `${k}-${j}`)}</span>}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l)))
          return <ol key={k} className="space-y-2">{lines.map((l, j) => <li key={j} className="flex gap-3"><span className="grid size-6 shrink-0 translate-y-1 place-items-center rounded-full bg-blue-900 text-xs font-bold text-white">{j + 1}</span><span>{inline(l.replace(/^\d+\. /, ""), `${k}-${j}`)}</span></li>)}</ol>;
        if (lines.every((l) => l.startsWith("> ")))
          return <blockquote key={k} className="border-l-4 border-amber-400 bg-amber-50/60 py-3 pl-5 pr-4 text-lg italic text-slate-800">{inline(lines.map((l) => l.slice(2)).join(" "), k)}</blockquote>;
        return <p key={k}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, `${k}-${j}`)}</Fragment>)}</p>;
      })}
    </div>
  );
}

// plain text version, e.g. for descriptions and reading time
export const plainText = (text: string) => text.replace(/[#>*_`]|\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
export const readingMinutes = (text: string) => Math.max(1, Math.round(plainText(text).split(" ").length / 200));
