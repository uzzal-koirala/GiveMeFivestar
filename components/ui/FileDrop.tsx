"use client";

import { useEffect, useState } from "react";
import { FaCloudArrowUp, FaFilePdf, FaFileImage, FaTrashCan, FaCheck } from "react-icons/fa6";

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Drag & drop / click-to-upload box with validation and image preview
export default function FileDrop({ file, onChange, title, hint, types = DEFAULT_TYPES, maxMB = 5 }: {
  file: File | null;
  onChange: (f: File | null) => void;
  title: string;
  hint: string;
  types?: string[];
  maxMB?: number;
}) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  // object URL for image previews, cleaned up when the file changes
  useEffect(() => {
    if (!file?.type.startsWith("image/")) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f?: File) {
    if (!f) return;
    if (!types.includes(f.type)) return setError("That file type isn’t supported.");
    if (f.size > maxMB * 1024 * 1024) return setError(`File is too large. Max ${maxMB} MB.`);
    setError("");
    onChange(f);
  }

  return (
    <div>
      {file ? (
        <div className="tab-fade flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          {preview ? (
            <img src={preview} alt="Preview" className="size-16 rounded-lg object-cover ring-1 ring-black/5" />
          ) : (
            <span className="grid size-16 place-items-center rounded-lg bg-white text-rose-500 ring-1 ring-black/5">
              {file.type === "application/pdf" ? <FaFilePdf className="size-7" /> : <FaFileImage className="size-7" />}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700"><FaCheck className="size-2.5" /> Attached · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove file"
            className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-600">
            <FaTrashCan className="size-3.5" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          className={`group flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${drag ? "scale-[1.01] border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/40"}`}
        >
          <span className={`grid size-14 place-items-center rounded-2xl shadow-sm transition ${drag ? "bg-blue-900 text-white" : "bg-white text-blue-800 group-hover:-translate-y-0.5"}`}>
            <FaCloudArrowUp className="size-6" />
          </span>
          <span className="mt-4 text-sm font-semibold text-slate-800">
            {drag ? "Drop it here" : <>{title} <span className="text-blue-700 underline underline-offset-2">browse</span></>}
          </span>
          <span className="mt-1 text-xs text-slate-500">{hint}</span>
          <input type="file" accept={types.join(",")} className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}
