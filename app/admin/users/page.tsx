// Super admin accounts: who can run the platform
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import AdminUsers from "@/components/admin/AdminUsers";

export default async function AdminUsersPage() {
  const me = await requireSuperAdmin();
  const admins = await db.user.findMany({
    where: { role: "super_admin" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, email: true, createdAt: true, avatarAt: true,
      sessions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      _count: { select: { sessions: true } },
    },
  });
  return (
    <AdminUsers
      meId={me.id}
      admins={admins.map((a) => ({
        id: a.id, name: a.name, email: a.email, joined: a.createdAt.toISOString(),
        avatarUrl: a.avatarAt ? `/api/avatar/${a.id}?v=${a.avatarAt.getTime()}` : null,
        lastLogin: a.sessions[0]?.createdAt.toISOString() ?? null, sessions: a._count.sessions,
      }))}
    />
  );
}
