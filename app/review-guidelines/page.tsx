// Review guidelines: how to collect reviews honestly with Give Me Five Star (and stay within Google's rules)
import type { Metadata } from "next";
import Link from "next/link";
import { FaHandshake, FaCircleCheck, FaBan, FaGift, FaUsers, FaCommentDots, FaWandMagicSparkles, FaReply, FaGavel } from "react-icons/fa6";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Review Guidelines",
  description: "How to collect Google reviews honestly with Give Me Five Star: what's allowed, what isn't, and how to stay within Google's rules.",
  alternates: { canonical: "/review-guidelines" },
};

const SUMMARY = [
  { Icon: FaHandshake, title: "Real customers only", text: "One real visit, one honest review, in the customer's own words." },
  { Icon: FaBan, title: "No rewards", text: "Never pay or give discounts in exchange for reviews." },
  { Icon: FaCircleCheck, title: "Everyone can review", text: "Ask every customer, not just the happy ones." },
];

const SECTIONS: LegalSection[] = [
  {
    id: "why", Icon: FaHandshake, title: "Why this matters",
    body: <p>Reviews only help you when people trust them. Google removes reviews, and can restrict business profiles, that break its rules. These guidelines keep your reviews genuine and your profile safe, and every {site.name} account must follow them.</p>,
  },
  {
    id: "do", Icon: FaCircleCheck, title: "Please do",
    body: (
      <ul>
        <li>ask <b>every</b> customer for a review, whatever their experience;</li>
        <li>ask soon after a real visit, while it&apos;s fresh;</li>
        <li>let customers choose their own star rating and edit the draft before posting;</li>
        <li>reply politely to all reviews, including critical ones.</li>
      </ul>
    ),
  },
  {
    id: "rewards", Icon: FaGift, title: "No rewards for reviews",
    body: <p>Don&apos;t offer money, discounts, free items, lucky draws or any other reward for a review, whether it&apos;s positive or not. A simple, friendly request is all you need.</p>,
  },
  {
    id: "self", Icon: FaUsers, title: "No reviews from yourself or your team",
    body: <p>Owners, staff, family and friends should not review your own business, and nobody should review a competitor. Never create or buy Google accounts to post reviews.</p>,
  },
  {
    id: "gating", Icon: FaCommentDots, title: "Private feedback, fairly",
    body: <p>You can invite customers to send you private feedback so you can fix problems quickly. But you must never stop an unhappy customer from posting on Google, or only send your review link to people you expect to be happy.</p>,
  },
  {
    id: "ai", Icon: FaWandMagicSparkles, title: "Using AI drafts honestly",
    body: <p>{site.name}&apos;s AI turns the customer&apos;s own rating and choices into a short draft. The customer must read it, change anything that doesn&apos;t match their experience, and post it themselves from their own Google account. Staff should never post drafts on a customer&apos;s behalf.</p>,
  },
  {
    id: "reply", Icon: FaReply, title: "Handling negative reviews",
    body: <p>Don&apos;t pressure anyone to change or delete a review. Reply calmly, apologise where it&apos;s fair, and offer to sort things out. Our <Link href="/blog/how-to-reply-to-google-reviews">guide to replying</Link> has examples.</p>,
  },
  {
    id: "breaking", Icon: FaGavel, title: "If the rules are broken",
    body: <p>If we find an account collecting fake or rewarded reviews, we may pause its review page or close the account, as set out in our <Link href="/terms">Terms of Service</Link>. If you see misuse, please tell us.</p>,
  },
];

export default function ReviewGuidelinesPage() {
  return (
    <LegalPage path="/review-guidelines" title="Review Guidelines" updated="27 September 2026" summary={SUMMARY} sections={SECTIONS}
      intro="Honest reviews win customers and keep your Google profile safe. Here's how to collect them the right way."
      contact={{ title: "Not sure if something is allowed?", text: "Ask us before you try it. We're happy to help." }} />
  );
}
