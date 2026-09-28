// Every business's support tickets
import { requireSuperAdmin } from "@/lib/auth";
import SupportCenter from "@/components/dashboard/support/SupportCenter";
import { db } from "@/lib/db";
import { TICKET_MESSAGES, toTicket } from "@/lib/data";

export default async function AdminSupport({ searchParams }: { searchParams: Promise<{ ticket?: string }> }) {
  await requireSuperAdmin();
  const { ticket } = await searchParams;
  const rows = await db.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { messages: TICKET_MESSAGES, user: { select: { name: true, businessName: true } } },
  });
  return <SupportCenter admin open={ticket} initial={rows.map((t) => ({ ...toTicket(t, t.user.name), business: t.user.businessName }))} />;
}
