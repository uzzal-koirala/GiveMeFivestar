// Support: raise tickets, track status, chat with the team
import SupportCenter from "@/components/dashboard/support/SupportCenter";
import { requireOwner } from "@/lib/auth";
import { getTickets } from "@/lib/data";
import { getPlatform } from "@/lib/platform";

export default async function SupportPage() {
  const user = await requireOwner();
  const [tickets, platform] = await Promise.all([getTickets(user.id, user.name), getPlatform()]);
  return <SupportCenter initial={tickets} contact={platform.support} />;
}
