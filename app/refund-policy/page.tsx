// Refund policy: all payments are final
import type { Metadata } from "next";
import { FaBan, FaGift, FaHeadset, FaCrown, FaBolt, FaBullhorn, FaCircleExclamation, FaArrowsRotate } from "react-icons/fa6";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  alternates: { canonical: "/refund-policy" },
  description: "All payments to Give Me Five Star are final and non-refundable. Here is exactly what that means for plans, AI review top-ups and ads.",
};

const UPDATED = "26 September 2026";

const SUMMARY = [
  { Icon: FaBan, title: "No refunds", text: "Every payment is final once it has been approved." },
  { Icon: FaGift, title: "Try before you pay", text: "The Free plan lets you test everything at no cost first." },
  { Icon: FaHeadset, title: "We fix payment mistakes", text: "Paid twice or not received? We make it right." },
];

const SECTIONS: LegalSection[] = [
  {
    id: "overview", Icon: FaBan, title: "Our policy",
    body: (
      <>
        <p>All payments made to {site.name} are <b>final and non-refundable</b>. This covers subscription plans, AI review top-up packs and review ads, whether you paid with eSewa, Khalti, bank transfer or any other method we accept.</p>
        <p>Because our service is digital and starts working the moment your payment is approved, we are not able to return money once it has been accepted.</p>
      </>
    ),
  },
  {
    id: "plans", Icon: FaCrown, title: "Subscription plans",
    body: (
      <>
        <p>When you upgrade to Pro or Business, the plan starts as soon as we approve your payment and runs until its end date. We do not refund unused days, weeks or months, including when you stop using the service part-way through.</p>
        <p>You can choose not to renew at any time. When a paid plan ends, your account simply moves back to the Free plan. Your review link, QR code and customer data stay safe.</p>
      </>
    ),
  },
  {
    id: "topups", Icon: FaBolt, title: "AI review top-ups",
    body: <p>Top-up credits are added to your account once your payment is approved. They never expire, so you can use them whenever you need them, but unused credits cannot be exchanged for money.</p>,
  },
  {
    id: "ads", Icon: FaBullhorn, title: "Review ads",
    body: <p>Ad payments are not refunded. Once an ad is approved we keep delivering until the full number of reviews you ordered has been reached, so you always receive what you paid for. You can follow the progress in your dashboard at any time.</p>,
  },
  {
    id: "mistakes", Icon: FaCircleExclamation, title: "Payment problems we will fix",
    body: (
      <>
        <p>A no-refund policy doesn&apos;t mean we ignore genuine mistakes. Contact us if:</p>
        <ul>
          <li>you paid <b>twice</b> for the same thing by accident;</li>
          <li>your payment was taken but the plan or credits <b>never appeared</b> on your account;</li>
          <li>you were charged a <b>different amount</b> from the price shown.</li>
        </ul>
        <p>Send us your transaction ID and a screenshot within 7 days. After we check it, we will apply the payment correctly or add its full value to your account as credit.</p>
      </>
    ),
  },
  {
    id: "changes", Icon: FaArrowsRotate, title: "Changes to this policy",
    body: <p>We may update this policy from time to time. The date at the top of this page shows when it last changed. Payments made before a change are covered by the policy that applied when you paid.</p>,
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage path="/refund-policy" title="Refund Policy" updated={UPDATED} summary={SUMMARY} sections={SECTIONS}
      intro="Short and clear: payments are final. Here is exactly what that means for you."
      contact={{ title: "Have a payment problem?", text: "Send your transaction ID and screenshot. We usually reply within a few hours." }} />
  );
}
