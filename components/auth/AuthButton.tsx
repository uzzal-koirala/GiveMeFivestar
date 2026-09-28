"use client";

import { openAuth, type AuthMode } from "./AuthDialog";

export default function AuthButton({ mode = "signup", className, children }: { mode?: AuthMode; className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => openAuth(mode)} className={className}>
      {children}
    </button>
  );
}
