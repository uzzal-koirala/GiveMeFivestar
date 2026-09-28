"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { FaQrcode, FaCopy, FaCheck, FaDownload, FaArrowUpRightFromSquare } from "react-icons/fa6";

export default function QrCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  // build on the client so the link uses the real site address
  useEffect(() => {
    const u = `${location.origin}/r/${slug}`;
    setUrl(u);
    QRCode.toDataURL(u, { width: 640, margin: 1, color: { dark: "#172554" } }).then(setQr);
  }, [slug]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold text-slate-900"><FaQrcode className="text-blue-700" /> Your review QR</h2>
      <p className="mt-0.5 text-sm text-slate-500">Customers scan this to leave a review</p>

      <div className="mt-5 flex flex-1 items-center justify-center rounded-lg bg-blue-950 p-6">
        <div className="rounded-lg bg-white p-3 shadow-xl">
          {qr ? (
            <img key={qr} src={qr} alt={`QR code for ${url}`} className="tab-fade size-40" />
          ) : (
            <div className="size-40 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 py-1.5 pl-3 pr-1.5">
        <p className="min-w-0 flex-1 truncate text-sm text-slate-600">{url.replace(/^https?:\/\//, "")}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open link" title="Open link" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700">
          <FaArrowUpRightFromSquare className="size-3" />
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
        <button onClick={copy} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-slate-700 transition hover:bg-slate-50">
          {copied ? <><FaCheck className="text-emerald-600" /> Copied</> : <><FaCopy /> Copy link</>}
        </button>
        <a href={qr || undefined} download="review-qr.png" className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 py-2.5 text-white transition hover:bg-blue-800">
          <FaDownload /> Download
        </a>
      </div>
    </section>
  );
}
