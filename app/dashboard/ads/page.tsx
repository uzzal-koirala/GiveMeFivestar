// Ads: request paid review campaigns and track them
import AdsManager from "@/components/dashboard/AdsManager";
import { requireOwner } from "@/lib/auth";
import { getAds } from "@/lib/data";
import { enabledMethods, getPlatform } from "@/lib/platform";

export default async function AdsPage() {
  const user = await requireOwner();
  const [ads, platform] = await Promise.all([getAds(user.id), getPlatform()]);
  return <AdsManager initial={ads} price={platform.adPrice} methods={enabledMethods(platform)} min={platform.adMin} max={platform.adMax} />;
}
