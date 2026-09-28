"use client";

// Public-page motion: sections fade up as they scroll into view, and a soft trailing cursor (mouse only).
// Skipped entirely for visitors who prefer reduced motion.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function MotionFx() {
  const path = usePathname();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  // scroll reveal: every <main> section except the first (the hero animates on its own)
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>("main > section, main > div > section")].slice(1);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    for (const el of els) {
      if (el.getBoundingClientRect().top < innerHeight) continue; // already on screen: leave as is
      el.classList.add("reveal");
      io.observe(el);
    }
    return () => { io.disconnect(); els.forEach((el) => el.classList.remove("reveal")); };
  }, [path]);

  // cursor: dot follows exactly, ring eases behind and grows over anything clickable
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = dot.current!, r = ring.current!;
    document.documentElement.classList.add("fx-cursor");
    let x = -100, y = -100, rx = x, ry = y, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as Element | null;
      const hot = !!t?.closest("a, button, summary, label, [role=button], [role=tab], select");
      const text = !!t?.closest("input, textarea, [contenteditable=true]");
      const inPopup = !!t?.closest("dialog[open]"); // popups cover the custom cursor, so the normal one takes over there
      r.dataset.state = text ? "text" : hot ? "hot" : "";
      d.style.opacity = r.style.opacity = text || inPopup ? "0" : "1";
    };
    const out = () => { d.style.opacity = r.style.opacity = "0"; };
    const down = () => r.classList.add("press");
    const up = () => r.classList.remove("press");
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", out);
    addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", move); document.removeEventListener("pointerleave", out);
      removeEventListener("pointerdown", down); removeEventListener("pointerup", up);
      document.documentElement.classList.remove("fx-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden className="fx-ring" />
      <div ref={dot} aria-hidden className="fx-dot" />
    </>
  );
}
