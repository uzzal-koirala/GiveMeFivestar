// Pricing lives on the one-page home now; keep old links working
import { redirect } from "next/navigation";

export default function PricingPage() {
  redirect("/#pricing");
}
