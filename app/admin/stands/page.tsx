// QR code stand orders: check payment, print, ship, deliver
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatform } from "@/lib/platform";
import { PageTitle } from "@/components/admin/ui";
import Tile from "@/components/admin/Tile";
import StandsBoard from "@/components/admin/StandsBoard";
import { FaHourglassHalf, FaPrint, FaTruckFast, FaBoxOpen } from "react-icons/fa6";

export default async function AdminStands() {
  await requireSuperAdmin();
  const [rows, platform] = await Promise.all([
    db.standOrder.findMany({ orderBy: { createdAt: "asc" }, omit: { proofData: true, designData: true }, include: { user: { select: { id: true, businessName: true, avatarAt: true } } } }),
    getPlatform(),
  ]);
  const count = (s: string) => rows.filter((o) => o.status === s).length;
  return (
    <div className="space-y-6">
      <PageTitle title="QR stands" desc="Check the payment, print the stands, then mark them shipped and delivered." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="New orders" value={count("submitted")} Icon={FaHourglassHalf} color={count("submitted") ? "amber" : "calm"} />
        <Tile label="Printing" value={count("printing")} Icon={FaPrint} color={count("printing") ? "blue" : "calm"} />
        <Tile label="On the way" value={count("shipped")} Icon={FaTruckFast} color={count("shipped") ? "blue" : "calm"} />
        <Tile label="Delivered" value={count("delivered")} Icon={FaBoxOpen} color="emerald" />
      </div>
      <StandsBoard items={rows.map((o) => ({
        id: o.id, userId: o.user.id, business: o.user.businessName,
        logoUrl: o.user.avatarAt ? `/api/avatar/${o.user.id}?v=${o.user.avatarAt.getTime()}` : null,
        quantity: o.quantity, amount: o.amount, design: o.design, designIsImage: (o.designType ?? "").startsWith("image/"), designName: o.designName,
        status: o.status, method: platform.methods.find((m) => m.id === o.method)?.label ?? o.method, txnId: o.txnId,
        fullName: o.fullName, phone: o.phone, province: o.province, district: o.district, city: o.city, address: o.address, landmark: o.landmark, notes: o.notes,
        createdAt: o.createdAt.toISOString(), decidedBy: o.decidedBy, decidedAt: o.decidedAt?.toISOString() ?? null,
        shippedAt: o.shippedAt?.toISOString() ?? null, deliveredAt: o.deliveredAt?.toISOString() ?? null, proofIsImage: o.proofType.startsWith("image/"),
      }))} />
    </div>
  );
}
