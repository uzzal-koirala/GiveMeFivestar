"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TICKET_MESSAGES, toTicket } from "@/lib/data";
import { readUpload } from "@/lib/uploads";
import { TICKET_CATEGORIES } from "@/lib/site";
import type { Ticket, TicketStatus } from "@/lib/types";

type Result = { error?: string; ticket?: Ticket };

const newTicket = z.object({
  subject: z.string().trim().min(3, "Add a short subject.").max(120),
  category: z.enum(TICKET_CATEGORIES as [string, ...string[]]),
  priority: z.enum(["low", "normal", "urgent"]),
  body: z.string().trim().min(5, "Please describe the issue.").max(2000),
});
const strings = (form: FormData) => Object.fromEntries([...form].filter(([, v]) => typeof v === "string"));

async function load(ticketId: string, userId: string, ownerName: string) {
  const t = await db.ticket.findFirst({ where: { id: ticketId, userId }, include: { messages: TICKET_MESSAGES } });
  return t && toTicket(t, ownerName);
}

export async function createTicket(form: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const parsed = newTicket.safeParse(strings(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const file = await readUpload(form.get("attachment"), { required: false });
  if (file.error) return { error: file.error };

  const { body, ...ticket } = parsed.data;
  const t = await db.ticket.create({
    data: {
      ...ticket, userId: user.id,
      messages: { create: { body, ...(file.file && { attachment: file.file.name, attachmentType: file.file.type, attachmentData: file.file.data }) } },
    },
  });
  return { ticket: (await load(t.id, user.id, user.name))! };
}

export async function replyTicket(form: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  const ticketId = String(form.get("ticketId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > 2000) return { error: "Please keep your message under 2000 characters." };
  const file = await readUpload(form.get("attachment"), { required: false });
  if (file.error) return { error: file.error };

  const t = await db.ticket.findFirst({ where: { id: ticketId, userId: user.id }, select: { status: true } });
  if (!t) return { error: "Ticket not found." };
  if (t.status === "closed") return { error: "This ticket is closed. Reopen it to reply." };

  await db.ticket.update({
    where: { id: ticketId },
    data: {
      status: t.status === "resolved" ? "open" : t.status, // replying reopens a resolved ticket
      messages: { create: { body, ...(file.file && { attachment: file.file.name, attachmentType: file.file.type, attachmentData: file.file.data }) } },
    },
  });
  return { ticket: (await load(ticketId, user.id, user.name))! };
}

// owners can mark their ticket resolved or reopen it
export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  if (status !== "resolved" && status !== "open") return { error: "Not allowed." };
  const { count } = await db.ticket.updateMany({ where: { id: ticketId, userId: user.id }, data: { status } });
  if (!count) return { error: "Ticket not found." };
  return { ticket: (await load(ticketId, user.id, user.name))! };
}
