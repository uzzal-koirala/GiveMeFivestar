"use client";

import { useRef, useState } from "react";
import { FaCamera, FaTrashCan, FaCloudArrowUp } from "react-icons/fa6";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 5;
const SIZE = 256; // avatars are stored as small square JPEGs

// centre-crop to a square and scale down, so uploads stay tiny
function toSquareJpeg(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      canvas.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

// Profile photo picker: click or drag & drop, validates type/size, previews instantly
export default function PhotoUpload({ value, onChange, initials }: { value: string; onChange: (dataUrl: string) => void; initials: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  function load(file?: File) {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Image is too large. Max ${MAX_MB} MB.`);
    setError("");
    const reader = new FileReader();
    reader.onload = () => toSquareJpeg(reader.result as string).then(onChange, (e) => setError(e.message));
    reader.readAsDataURL(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]); }}
      className={`flex flex-wrap items-center gap-5 rounded-2xl border-2 border-dashed p-5 transition ${drag ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}
    >
      <button type="button" onClick={() => input.current?.click()} aria-label="Change profile photo" className="group relative size-20 shrink-0 overflow-hidden rounded-2xl">
        {value ? (
          <img src={value} alt="Profile photo" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-blue-950 text-2xl font-bold text-white">{initials}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-slate-900/50 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <FaCamera className="size-5" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">Profile photo</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {drag ? "Drop your image here" : `Drag an image here or upload one. JPG, PNG or WebP, up to ${MAX_MB} MB.`}
        </p>
        {error && <p role="alert" className="mt-1 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
            <FaCloudArrowUp /> {value ? "Change photo" : "Upload photo"}
          </button>
          {value && (
            <button type="button" onClick={() => { onChange(""); setError(""); }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
              <FaTrashCan className="size-3" /> Remove
            </button>
          )}
        </div>
      </div>

      <input ref={input} type="file" accept={TYPES.join(",")} hidden onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
