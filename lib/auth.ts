// Business-owner sessions: random token in an httpOnly cookie, SHA-256 hash stored in the DB
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const COOKIE = "qr_session";
const MAX_AGE_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 864e5);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Current user for this request (null when signed out or the session expired)
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, businessName: true, role: true, avatarAt: true, suspended: true } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.suspended) return null; // suspended = signed out
  const { avatarAt, suspended: _suspended, ...user } = session.user;
  return { ...user, avatarUrl: avatarAt ? `/api/avatar/${user.id}?v=${avatarAt.getTime()}` : null };
});

// Dashboard pages: layouts don't re-run on client navigation, so each page checks for itself
export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) redirect("/?auth=login");
  if (user.role === "super_admin") redirect("/admin");
  return user;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/?auth=login");
  if (user.role !== "super_admin") redirect("/dashboard");
  return user;
}

// after a password change: sign out every other device, keep this one
export async function endOtherSessions(userId: string) {
  const token = (await cookies()).get(COOKIE)?.value;
  await db.session.deleteMany({ where: { userId, ...(token && { id: { not: sha256(token) } }) } });
}

// ponytail: in-memory, per server process; move to the DB if you run several instances
const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5, LOCK_MS = 15 * 60_000;
export const loginLocked = (email: string) => (failures.get(email)?.until ?? 0) > Date.now();
export function recordLogin(email: string, ok: boolean) {
  if (ok) return void failures.delete(email);
  const f = failures.get(email);
  const count = f && f.until < Date.now() && f.count >= MAX_FAILS ? 1 : (f?.count ?? 0) + 1;
  failures.set(email, { count, until: count >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  store.delete(COOKIE);
}
