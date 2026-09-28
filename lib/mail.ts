// Outgoing email over SMTP (settings in .env)
import "server-only";
import nodemailer from "nodemailer";
import { site, SITE_URL } from "@/lib/site";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465, // 465 = SSL from the start, 587 = STARTTLS
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Email clients ignore most modern CSS: tables + inline styles only
export function otpEmail(name: string, code: string) {
  const first = esc(name.split(" ")[0] || "there");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Your verification code</title></head>
<body style="margin:0;padding:0;background:#f1f5f9">
<div style="display:none;max-height:0;overflow:hidden">Your Give Me Five Star code is ${code}. It expires in 10 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:'Segoe UI',Arial,sans-serif">
    <tr><td style="background:#172554;border-radius:20px 20px 0 0;padding:32px 36px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:40px;height:40px;border-radius:10px;background:#fcd34d;text-align:center;font-size:20px;font-weight:900;color:#172554;line-height:40px">5</td>
        <td style="padding-left:12px;font-size:13px;font-weight:800;letter-spacing:2.5px;color:#ffffff">GIVE ME FIVE STAR</td>
      </tr></table>
      <h1 style="margin:28px 0 6px;font-size:26px;line-height:1.25;color:#ffffff;font-weight:700">Confirm your email</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#bfdbfe">One quick step and your review page is ready.</p>
    </td></tr>
    <tr><td style="height:4px;background:#fcd34d;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="background:#ffffff;padding:36px;border-radius:0 0 20px 20px">
      <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:600">Hi ${first},</p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569">Thanks for signing up. Enter this code on the sign-up screen to verify your email address:</p>
      <!-- one plain run of digits (letter-spacing only), so a tap or double-click copies the whole code -->
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto"><tr>
        <td style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:14px;padding:16px 28px 16px 40px;text-align:center">
          <span style="font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:12px;color:#172554;user-select:all;-webkit-user-select:all">${code}</span>
        </td>
      </tr></table>
      <p style="margin:10px 0 0;text-align:center;font-size:12px;color:#94a3b8">Tap and hold (or double-click) the code to copy it.</p>
      <p style="margin:18px 0 0;text-align:center;font-size:13px;color:#64748b">This code expires in <strong style="color:#0f172a">10 minutes</strong>.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px"><tr>
        <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.6;color:#92400e">
          <strong>Didn't sign up?</strong> You can ignore this email. No account is created until the code is entered. Never share this code with anyone, including our team.
        </td>
      </tr></table>
      <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#475569">Need help? Call or WhatsApp us on <a href="${site.whatsapp}" style="color:#1d4ed8;font-weight:600;text-decoration:none">${site.phone}</a>.</p>
      <p style="margin:16px 0 0;font-size:14px;color:#475569">The ${site.name} team</p>
    </td></tr>
    <tr><td style="padding:24px 12px;text-align:center;font-size:12px;line-height:1.6;color:#94a3b8">
      ${site.name} · ${site.country}<br><a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL.replace(/^https?:\/\//, "")}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
  const text = `Hi ${name.split(" ")[0] || "there"},\n\nYour ${site.name} verification code is: ${code}\n\nIt expires in 10 minutes. If you didn't sign up, ignore this email.\n\nNeed help? ${site.phone}`;
  return { subject: `${code} is your ${site.name} verification code`, html, text };
}

export async function sendMail(to: string, mail: { subject: string; html: string; text: string }) {
  await transport.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, to, ...mail });
}
