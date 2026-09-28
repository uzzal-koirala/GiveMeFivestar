"use client";

import { useEffect, useState } from "react";

// Cycles through phrases with a slide-up animation; screen readers get the first phrase only
export default function RotatingWords({ words, every = 2600 }: { words: string[]; every?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), every);
    return () => clearInterval(t);
  }, [words.length, every]);
  return (
    <>
      <span className="sr-only">{words[0]}</span>
      <span aria-hidden className="relative inline-block overflow-hidden whitespace-nowrap pb-2 align-bottom">
        <span key={i} className="word-in inline-block">{words[i]}</span>
        <span className="absolute inset-x-0 bottom-0 h-1.5 rounded-full bg-amber-300/30">
          <span key={`bar${i}`} className="word-bar block h-full rounded-full bg-amber-300" style={{ animationDuration: `${every}ms` }} />
        </span>
      </span>
    </>
  );
}
