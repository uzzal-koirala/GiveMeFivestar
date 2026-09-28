// Messages from the website contact form
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import MessagesBoard from "@/components/admin/MessagesBoard";

export default async function AdminMessages() {
  await requireSuperAdmin();
  const rows = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <PageTitle title="Messages" desc="Everything sent from the contact form on your website." />
      <MessagesBoard items={rows.map((m) => ({
        id: m.id, name: m.name, phone: m.phone, email: m.email, business: m.business, city: m.city, topic: m.topic, message: m.message,
        status: m.status === "handled" ? "handled" : "new", handledBy: m.handledBy, handledAt: m.handledAt?.toISOString() ?? null, createdAt: m.createdAt.toISOString(),
      }))} />
    </div>
  );
}
