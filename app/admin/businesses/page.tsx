// Every business on the platform
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import BusinessesTable from "@/components/admin/BusinessesTable";
import CreateBusiness from "@/components/admin/CreateBusiness";
import { activePlan } from "@/lib/site";
import Tile from "@/components/admin/Tile";
import { FaStore, FaCrown, FaUserPlus, FaHourglassHalf } from "react-icons/fa6";

export default async function AdminBusinesses() {
  await requireSuperAdmin();
  const users = await db.user.findMany({
    where: { role: "owner" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, phone: true, businessName: true, plan: true, planExpiresAt: true, credits: true, createdAt: true, suspended: true, avatarAt: true,
      link: { select: { slug: true, location: true, googleReviewUrl: true, _count: { select: { submissions: true } } } },
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paid = users.filter((u) => activePlan(u.plan, u.planExpiresAt) !== "free").length;
  const newThisMonth = users.filter((u) => u.createdAt >= monthStart).length;
  const pending = users.filter((u) => !u.link).length;

  return (
    <div className="space-y-6">
      <PageTitle title="Businesses" desc={`${users.length} business${users.length === 1 ? "" : "es"} on Give Me Five Star.`}>
        <CreateBusiness />
      </PageTitle>

      {/* each box opens the list already filtered */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile href="/admin/businesses" label="Total businesses" value={users.length} Icon={FaStore} color="blue" />
        <Tile href="/admin/businesses?plan=paid" label="Paid plans" value={paid} Icon={FaCrown} color={paid ? "amber" : "calm"} />
        <Tile href="/admin/businesses?joined=month" label="Joined this month" value={newThisMonth} Icon={FaUserPlus} color={newThisMonth ? "emerald" : "calm"} />
        <Tile href="/admin/businesses?status=setup" label="Setup pending" value={pending} Icon={FaHourglassHalf} color={pending ? "rose" : "calm"} />
      </div>

      <BusinessesTable
        rows={users.map((u) => ({
          id: u.id, name: u.name, email: u.email, phone: u.phone ?? "", businessName: u.businessName, plan: activePlan(u.plan, u.planExpiresAt), credits: u.credits,
          joined: u.createdAt.toISOString(), responses: u.link?._count.submissions ?? 0, suspended: u.suspended, location: u.link?.location ?? "", setup: !!u.link,
          logoUrl: u.avatarAt ? `/api/avatar/${u.id}?v=${u.avatarAt.getTime()}` : null,
        }))}
      />
    </div>
  );
}
