// Super admin shell: same look as the business dashboard, only for role = super_admin
import TopNav from "@/components/dashboard/TopNav";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav variant="admin" ownerName={user.name} email={user.email} avatarUrl={user.avatarUrl} />
      <div className="h-40 bg-blue-950" />
      <main className="mx-auto -mt-32 max-w-6xl px-4 pb-16 sm:px-6">{children}</main>
    </div>
  );
}
