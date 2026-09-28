// Everything customers submitted: Google reviews (AI-written) and feedback (details-only mode)
import { FaStar, FaCommentDots } from "react-icons/fa6";
import ReviewCards from "@/components/dashboard/ReviewCards";
import { requireOwner } from "@/lib/auth";
import { getCustomers } from "@/lib/data";
import { db } from "@/lib/db";
import { activePlan, planOf } from "@/lib/site";

export default async function ReviewsPage() {
  const user = await requireOwner();
  const [all, account] = await Promise.all([
    getCustomers(user.id), // newest first
    db.user.findUnique({ where: { id: user.id }, select: { plan: true, planExpiresAt: true } }),
  ]);
  // same cut as the Customers page: contact details of customers beyond the plan's limit never reach the browser
  const limit = planOf(activePlan(account?.plan ?? "free", account?.planExpiresAt)).customers;
  const visible = new Set((limit === null ? all : all.slice(0, limit)).map((c) => c.id));
  const items = all.filter((c) => c.source !== "import").map((c) => (visible.has(c.id) ? c : { ...c, phone: "", location: "" }));
  const reviews = items.filter((i) => i.review).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="mt-1 text-blue-200">Google reviews and feedback from your customers.</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: reviews, label: "Google reviews", Icon: FaStar },
            { value: items.length - reviews, label: "feedback", Icon: FaCommentDots },
          ].map(({ value, label, Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 text-white">
              <Icon className="size-5 text-amber-300" />
              <div>
                <p className="text-lg font-bold leading-none">{value}</p>
                <p className="text-xs text-blue-200">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ReviewCards items={items} />
    </div>
  );
}
