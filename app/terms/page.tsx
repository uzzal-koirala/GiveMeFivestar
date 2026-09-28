// Terms of service for businesses using Give Me Five Star
import type { Metadata } from "next";
import Link from "next/link";
import {
  FaFileContract, FaStar, FaScaleBalanced, FaHandshake, FaUserCheck, FaCrown, FaBan, FaGoogle, FaServer, FaUserSlash, FaTriangleExclamation, FaArrowsRotate,
} from "react-icons/fa6";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Give Me Five Star: accounts, plans and payments, honest reviews, and what we each promise.",
  alternates: { canonical: "/terms" },
};

const SUMMARY = [
  { Icon: FaStar, title: "Honest reviews only", text: "Every review must come from a real customer's real visit." },
  { Icon: FaCrown, title: "Clear plans", text: "Free forever, or a paid plan that starts when payment is approved." },
  { Icon: FaScaleBalanced, title: "Fair for both sides", text: "What you can expect from us, and what we expect from you." },
];

const SECTIONS: LegalSection[] = [
  {
    id: "agree", Icon: FaHandshake, title: "Agreeing to these terms",
    body: <p>By creating an account or using {site.name}, you agree to these terms, our <Link href="/privacy">Privacy Policy</Link> and our <Link href="/review-guidelines">Review Guidelines</Link>. If you use {site.name} for a business, you confirm you are allowed to act for that business.</p>,
  },
  {
    id: "account", Icon: FaUserCheck, title: "Your account",
    body: <p>Give us correct details, keep your password private, and tell us quickly if you think someone else has used your account. You are responsible for what happens in your account and on your review page.</p>,
  },
  {
    id: "plans", Icon: FaCrown, title: "Plans, payments and credits",
    body: (
      <ul>
        <li>The Free plan includes a limited number of AI reviews each month, as shown on our <Link href="/#pricing">pricing</Link>.</li>
        <li>Paid plans and top-ups start once our team has checked and approved your payment.</li>
        <li>Paid plans run until their end date and then move back to the Free plan unless you renew.</li>
        <li>Prices are in Nepali rupees. All payments are final, as explained in our <Link href="/refund-policy">Refund Policy</Link>.</li>
      </ul>
    ),
  },
  {
    id: "honest", Icon: FaStar, title: "Honest reviews",
    body: (
      <>
        <p>{site.name} helps real customers say what they genuinely think. You must not use it to:</p>
        <ul>
          <li>write or post reviews yourself, or ask staff, friends or family to review your own business;</li>
          <li>offer money, discounts or gifts in exchange for reviews;</li>
          <li>post reviews for a business you don&apos;t own or manage.</li>
        </ul>
        <p>Full details are in our <Link href="/review-guidelines">Review Guidelines</Link>.</p>
      </>
    ),
  },
  {
    id: "use", Icon: FaBan, title: "Things you must not do",
    body: (
      <ul>
        <li>break the law, or send spam or harmful content through the service;</li>
        <li>try to break into, overload or copy the service;</li>
        <li>use someone else&apos;s business name, logo or Google page without permission.</li>
      </ul>
    ),
  },
  {
    id: "google", Icon: FaGoogle, title: "Google is separate",
    body: <p>{site.name} is not part of, or endorsed by, Google. Customers post reviews from their own Google accounts, and Google decides which reviews it shows or removes. We can&apos;t promise any particular ranking or number of reviews.</p>,
  },
  {
    id: "content", Icon: FaFileContract, title: "Your content",
    body: <p>You own your logo, photos, business details and customer list. You let us store and show them only as needed to run your review page and dashboard. You confirm you have the right to use anything you upload.</p>,
  },
  {
    id: "service", Icon: FaServer, title: "The service",
    body: <p>We work hard to keep {site.name} running smoothly, but it may sometimes be unavailable for maintenance or problems outside our control. We may improve or change features over time, and will tell you about changes that affect paid plans.</p>,
  },
  {
    id: "suspend", Icon: FaUserSlash, title: "Suspending or closing accounts",
    body: <p>You can stop using {site.name} at any time. We may suspend or close an account that breaks these terms, especially for fake reviews or misuse. When an account is suspended, its review page goes offline.</p>,
  },
  {
    id: "liability", Icon: FaTriangleExclamation, title: "Limits of our responsibility",
    body: <p>As far as the law allows, {site.name} is provided &ldquo;as is&rdquo;, and we are not responsible for indirect losses such as lost profits. Our total responsibility is limited to the amount you paid us in the three months before the problem happened.</p>,
  },
  {
    id: "changes", Icon: FaArrowsRotate, title: "Changes and governing law",
    body: <p>We may update these terms; the date at the top shows the latest version. If you keep using {site.name} after a change, the new terms apply. These terms are governed by the laws of {site.country}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage path="/terms" title="Terms of Service" updated="27 September 2026" summary={SUMMARY} sections={SECTIONS}
      intro="The simple rules for using Give Me Five Star, so we both know what to expect."
      contact={{ title: "Questions about these terms?", text: "We're happy to explain anything before you sign up or upgrade." }} />
  );
}
