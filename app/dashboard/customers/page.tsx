// Customers: everyone who used the review page, plus CSV imports
import CustomersManager from "@/components/dashboard/CustomersManager";
import { requireOwner } from "@/lib/auth";
import { getCustomers } from "@/lib/data";
import { db } from "@/lib/db";
import { activePlan, planOf } from "@/lib/site";

export default async function CustomersPage() {
  const user = await requireOwner();
  const [customers, account] = await Promise.all([
    getCustomers(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { plan: true, planExpiresAt: true } }),
  ]);
  // Free and Pro keep everyone saved but only show the newest few; upgrading reveals the rest.
  // Cut on the server so hidden customers are never sent to the browser.
  const plan = planOf(activePlan(account?.plan ?? "free", account?.planExpiresAt));
  const limit = plan.customers;
  const newest = [...customers].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const shown = limit === null ? newest : newest.slice(0, limit);
  const next = plan.id === "free" ? "Pro" : "Business";
  return <CustomersManager initial={shown} limit={limit} hiddenOnServer={customers.length - shown.length} planName={plan.name} nextPlan={next} />;
}
