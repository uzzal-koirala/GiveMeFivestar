"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus, FaXmark, FaUserShield, FaKey, FaTrashCan, FaEye, FaEyeSlash, FaWandMagicSparkles, FaCircleExclamation, FaCheck, FaClock, FaCalendar, FaDesktop,
} from "react-icons/fa6";
import { createAdmin, removeAdmin, resetAdminPassword } from "@/app/actions/admin";
import { saveSecurity } from "@/app/actions/settings";
import { colorFor } from "@/components/dashboard/CustomersTable";
import { makePassword } from "./CreateBusiness";
import { PageTitle, fmtDate } from "./ui";

type Admin = { id: string; name: string; email: string; joined: string; avatarUrl: string | null; lastLogin: string | null; sessions: number };

const field = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";
const small = "mb-1.5 block text-xs font-semibold text-slate-600";
const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

function PasswordField({ value, onChange, label = "Password" }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [show, setShow] = useState(true);
  return (
    <div>
      <span className={small}>{label}</span>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} type={show ? "text" : "password"} autoComplete="new-password" aria-label={label} className={`${field} pr-9 font-mono`} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">{show ? <FaEyeSlash /> : <FaEye />}</button>
        </div>
        <button type="button" onClick={() => { onChange(makePassword()); setShow(true); }} title="Generate a strong password" aria-label="Generate password"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-800"><FaWandMagicSparkles className="size-3.5" /></button>
      </div>
      <span className="mt-1.5 block text-xs text-slate-500">At least 8 characters. Share it privately.</span>
    </div>
  );
}

// Small modal used for "add admin" and "reset password"
function Modal({ dialog, title, desc, children, onSubmit, submitLabel, pending, error }: {
  dialog: React.RefObject<HTMLDialogElement | null>; title: string; desc: string; children: React.ReactNode;
  onSubmit: () => void; submitLabel: string; pending: boolean; error: string;
}) {
  return (
    <dialog ref={dialog} aria-label={title} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      className="auth-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border-0 bg-white p-0 shadow-2xl outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-900 text-white"><FaUserShield className="size-4" /></span>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FaXmark /></button>
        </div>
        <div className="space-y-4 p-6">{children}</div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          {error && <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-rose-600"><FaCircleExclamation /> {error}</p>}
          <button type="button" onClick={() => dialog.current?.close()} className="ml-auto rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={pending} className="rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">{pending ? "Saving…" : submitLabel}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function AdminUsers({ admins, meId }: { admins: Admin[]; meId: string }) {
  const router = useRouter();
  const addDialog = useRef<HTMLDialogElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const selfDialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [resetFor, setResetFor] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>, done: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.error) return setError(r.error);
      setError(""); setNotice(done); after?.(); router.refresh();
    });

  return (
    <div className="space-y-6">
      <PageTitle title="Users" desc="Super admins who can manage every business, payment and setting.">
        <button type="button" onClick={() => { setForm({ name: "", email: "", password: makePassword() }); setError(""); addDialog.current?.showModal(); }}
          className="flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-bold text-blue-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-200">
          <FaPlus className="size-3" /> Add admin
        </button>
      </PageTitle>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          <FaCheck /> {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="ml-auto text-emerald-700/60 hover:text-emerald-900"><FaXmark /></button>
        </p>
      )}
      {error && !addDialog.current?.open && !resetDialog.current?.open && !selfDialog.current?.open && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200"><FaCircleExclamation /> {error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {admins.map((a) => {
          const me = a.id === meId;
          return (
            <article key={a.id} className={`flex flex-col rounded-lg border bg-white p-5 shadow-sm ${me ? "border-blue-200 ring-4 ring-blue-50" : "border-slate-200"}`}>
              <div className="flex items-center gap-3.5">
                {a.avatarUrl
                  ? <img src={a.avatarUrl} alt="" className="size-14 shrink-0 rounded-full object-cover" />
                  : <span className={`grid size-14 shrink-0 place-items-center rounded-full text-base font-bold text-white ${colorFor(a.name)}`}>{initials(a.name)}</span>}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-bold text-slate-900">
                    {a.name} {me && <span className="rounded-full bg-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">You</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">{a.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200"><FaUserShield className="size-2.5" /> Super admin</span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-md bg-slate-50 py-2.5 text-center">
                <div><dt className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><FaCalendar className="size-2.5" /> Added</dt><dd className="text-xs font-bold leading-6 text-slate-900">{fmtDate(a.joined)}</dd></div>
                <div><dt className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><FaClock className="size-2.5" /> Last login</dt><dd className="text-xs font-bold leading-6 text-slate-900">{a.lastLogin ? ago(a.lastLogin) : "Never"}</dd></div>
                <div><dt className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><FaDesktop className="size-2.5" /> Devices</dt><dd className="font-bold tabular-nums text-slate-900">{a.sessions}</dd></div>
              </dl>

              {me ? (
                <button type="button" onClick={() => { setCurrent(""); setNewPassword(""); setError(""); selfDialog.current?.showModal(); }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-800">
                  <FaKey className="size-3" /> Change my password
                </button>
              ) : confirmId === a.id ? (
                <div role="alertdialog" aria-label={`Remove ${a.name}`} className="mt-4 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-200">
                  <p className="text-sm font-medium text-rose-800">Remove {a.name}? They lose admin access right away.</p>
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-white">Keep</button>
                    <button type="button" disabled={pending} onClick={() => run(() => removeAdmin(a.id), `${a.name} was removed.`, () => setConfirmId(null))}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><FaTrashCan className="size-3" /> Remove</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => { setResetFor(a); setNewPassword(makePassword()); setError(""); resetDialog.current?.showModal(); }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-800">
                    <FaKey className="size-3" /> Reset password
                  </button>
                  <button type="button" onClick={() => { setConfirmId(a.id); setError(""); }} aria-label={`Remove ${a.name}`} title="Remove admin"
                    className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><FaTrashCan className="size-3.5" /></button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Modal dialog={addDialog} title="Add a super admin" desc="They can manage every business, payment and setting." submitLabel="Create admin" pending={pending} error={error}
        onSubmit={() => run(() => createAdmin(form), `${form.name} can now log in as a super admin.`, () => addDialog.current?.close())}>
        <label className="block"><span className={small}>Full name</span><input required value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }} placeholder="e.g. Ram Thapa" className={field} /></label>
        <label className="block"><span className={small}>Email</span><input required type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }} placeholder="name@revue.com" autoComplete="off" className={field} /></label>
        <PasswordField value={form.password} onChange={(password) => { setForm({ ...form, password }); setError(""); }} />
      </Modal>

      <Modal dialog={resetDialog} title={`Reset password${resetFor ? ` for ${resetFor.name}` : ""}`} desc="They’ll be signed out everywhere and must use the new password." submitLabel="Set new password" pending={pending} error={error}
        onSubmit={() => resetFor && run(() => resetAdminPassword(resetFor.id, newPassword), `Password updated for ${resetFor.name}.`, () => resetDialog.current?.close())}>
        <PasswordField label="New password" value={newPassword} onChange={(v) => { setNewPassword(v); setError(""); }} />
      </Modal>
      <Modal dialog={selfDialog} title="Change my password" desc="Enter your current password, then choose a new one." submitLabel="Update password" pending={pending} error={error}
        onSubmit={() => { const me = admins.find((a) => a.id === meId)!; run(() => saveSecurity({ email: me.email, currentPassword: current, newPassword }), "Your password was updated.", () => selfDialog.current?.close()); }}>
        <label className="block"><span className={small}>Current password</span>
          <input required type="password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(""); }} autoComplete="current-password" aria-label="Current password" className={field} />
        </label>
        <PasswordField label="New password" value={newPassword} onChange={(v) => { setNewPassword(v); setError(""); }} />
      </Modal>
    </div>
  );
}
