"use server";

import { redirect } from "next/navigation";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { createSession, deleteSession, hashPassword, loginLocked, recordLogin, verifyPassword } from "@/lib/auth";
import { email as emailSchema, loginSchema, signupSchema } from "@/lib/validators";
import { getPlatform } from "@/lib/platform";
import { otpEmail, sendMail } from "@/lib/mail";

// verify = the email a code was just sent to; the dialog then asks for the code
export type AuthState = { error?: string; fields?: Record<string, string>; verify?: string } | undefined;

// keep what the user typed (except passwords) so the form doesn't reset on an error
const keep = (form: FormData) =>
  Object.fromEntries([...form].filter(([k]) => k !== "password").map(([k, v]) => [k, String(v)]));

// ---- Email verification codes ----
const OTP_MINUTES = 10, OTP_MAX_TRIES = 5, RESEND_SECONDS = 60;
const otpHash = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");

async function sendCode(user: { id: string; name: string; email: string; otpSentAt: Date | null }): Promise<string | undefined> {
  const wait = user.otpSentAt ? Math.ceil((user.otpSentAt.getTime() + RESEND_SECONDS * 1000 - Date.now()) / 1000) : 0;
  if (wait > 0) return `Please wait ${wait} seconds before asking for a new code.`;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.user.update({
    where: { id: user.id },
    data: { otpHash: otpHash(user.id, code), otpExpiresAt: new Date(Date.now() + OTP_MINUTES * 60_000), otpSentAt: new Date(), otpAttempts: 0 },
  });
  try {
    await sendMail(user.email, otpEmail(user.name, code));
  } catch (e) {
    console.error("OTP email failed:", e);
    await db.user.update({ where: { id: user.id }, data: { otpSentAt: null } }); // let them retry straight away
    return "We couldn't send the email right now. Please try again in a moment.";
  }
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: keep(form) };
  const { name, businessName, email, password } = parsed.data;
  const platform = await getPlatform();
  if (!platform.signupsOpen) return { error: "New sign-ups are paused right now. Please try again later.", fields: keep(form) };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing && (existing.emailVerifiedAt || existing.role !== "owner")) {
    return { error: "An account with this email already exists. Try logging in.", fields: keep(form) };
  }
  // an unfinished sign-up for this email is simply restarted with the new details
  const data = { name, businessName, passwordHash: await hashPassword(password) };
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data })
    : await db.user.create({ data: { ...data, email, credits: platform.signupCredits } });

  const error = await sendCode(user);
  return { verify: email, fields: keep(form), ...(error && !error.startsWith("Please wait") && { error }) };
}

export async function verifyEmail(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(form.get("email")).data ?? "";
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  const state = { verify: email };
  if (code.length !== 6) return { ...state, error: "Enter the 6-digit code from the email." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt || !user.otpHash || !user.otpExpiresAt) return { ...state, error: "This code isn't valid. Send a new one." };
  if (user.otpAttempts >= OTP_MAX_TRIES) return { ...state, error: "Too many wrong tries. Send a new code." };
  if (user.otpExpiresAt < new Date()) return { ...state, error: "This code has expired. Send a new one." };

  const ok = timingSafeEqual(Buffer.from(otpHash(user.id, code)), Buffer.from(user.otpHash));
  if (!ok) {
    await db.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
    const left = OTP_MAX_TRIES - user.otpAttempts - 1;
    return { ...state, error: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Send a new code." };
  }
  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), otpHash: null, otpExpiresAt: null, otpAttempts: 0 } });
  if (user.suspended) return { error: "This account is suspended. Please contact Give Me Five Star support." };
  await createSession(user.id);
  redirect("/dashboard");
}

// same answer whether or not the email exists, so accounts can't be probed
export async function resendCode(email: string): Promise<{ error?: string }> {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.emailVerifiedAt || user.role !== "owner") return {};
  const error = await sendCode(user);
  return error ? { error } : {};
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: keep(form) };
  const { email, password } = parsed.data;

  if (loginLocked(email)) return { error: "Too many wrong attempts. Please wait 15 minutes and try again.", fields: keep(form) };
  const user = await db.user.findUnique({ where: { email } });
  // same message for unknown email and wrong password, so accounts can't be guessed
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordLogin(email, false);
    return { error: "Incorrect email or password.", fields: keep(form) };
  }
  recordLogin(email, true);
  if (user.suspended) return { error: "This account is suspended. Please contact Give Me Five Star support.", fields: keep(form) };
  // owners who never confirmed their email do that first (admins are created by other admins)
  if (user.role === "owner" && !user.emailVerifiedAt) {
    const error = await sendCode(user);
    return { verify: email, fields: keep(form), ...(error && !error.startsWith("Please wait") && { error }) };
  }

  await createSession(user.id);
  redirect(user.role === "super_admin" ? "/admin" : "/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
