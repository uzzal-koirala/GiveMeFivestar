// Privacy policy: what Give Me Five Star collects, why, who sees it, and your choices
import type { Metadata } from "next";
import Link from "next/link";
import {
  FaUserShield, FaBan, FaTrashCan, FaBuilding, FaDatabase, FaGears, FaWandMagicSparkles, FaShareNodes, FaLock, FaClock, FaHandHoldingHeart, FaChild, FaArrowsRotate,
} from "react-icons/fa6";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Give Me Five Star collects, uses and protects information about business owners and their customers.",
  alternates: { canonical: "/privacy" },
};

const SUMMARY = [
  { Icon: FaUserShield, title: "Only what we need", text: "We collect just enough to run your review page and account." },
  { Icon: FaBan, title: "Never sold", text: "We don't sell personal data or use it for advertising." },
  { Icon: FaTrashCan, title: "You're in control", text: "Ask us any time to see, fix or delete your data." },
];

const SECTIONS: LegalSection[] = [
  {
    id: "who", Icon: FaBuilding, title: "Who we are",
    body: <p>{site.name} is a service that helps businesses collect Google reviews using a QR code, a review link and AI writing help. This policy explains what information we handle when you use our website, your dashboard, or a business&apos;s review page.</p>,
  },
  {
    id: "collect", Icon: FaDatabase, title: "What we collect",
    body: (
      <>
        <p><b>Business owners:</b></p>
        <ul>
          <li>your name, email, phone number and a password (we only keep a secure, one-way hash of it);</li>
          <li>your business details: business name, location, Google review link, website and social links, logo and page design;</li>
          <li>payment details you send us for plans and top-ups: the method, amount, transaction ID and the payment screenshot you upload;</li>
          <li>delivery details for QR stand orders: the receiver&apos;s name, phone number and address, plus any design file you upload;</li>
          <li>messages you send to our support team.</li>
        </ul>
        <p><b>Customers using a business&apos;s review page:</b></p>
        <ul>
          <li>the name, phone number and location you enter, what you bought or tried, your star rating, and the review or private feedback you choose to send.</li>
        </ul>
        <p><b>Website visitors:</b> anything you send through our contact form or a job application, such as your name, phone, email and message.</p>
        <p>For a full list, with who can see each item and how long we keep it, see <Link href="/data-we-collect">Data We Collect</Link>.</p>
      </>
    ),
  },
  {
    id: "use", Icon: FaGears, title: "How we use it",
    body: (
      <ul>
        <li>to run your account, review page, QR code and dashboard;</li>
        <li>to write review drafts and show each business its own customer list and ratings;</li>
        <li>to check and approve payments, and to answer support requests;</li>
        <li>to keep the service safe, for example by stopping spam and misuse;</li>
        <li>to tell you about important changes to your account or these policies.</li>
      </ul>
    ),
  },
  {
    id: "ai", Icon: FaWandMagicSparkles, title: "AI review writing",
    body: <p>To write review drafts, we send the details needed for the review, such as the star rating, what the customer bought and the business&apos;s chosen keywords, to our AI provider. We don&apos;t send customers&apos; names, phone numbers or locations. The customer always reads the draft and decides whether to post it. We don&apos;t allow our AI provider to use this information to advertise to anyone.</p>,
  },
  {
    id: "share", Icon: FaShareNodes, title: "Who we share it with",
    body: (
      <>
        <p>We never sell personal information. We only share it:</p>
        <ul>
          <li>with <b>the business</b> whose review page a customer used, so they can see their own customers and feedback;</li>
          <li>with service providers that help us run {site.name}, such as hosting and AI writing, only for that purpose;</li>
          <li>when the law requires it.</li>
        </ul>
        <p>Reviews are posted to Google by the customer, from their own Google account. What happens on Google is covered by Google&apos;s own privacy policy.</p>
      </>
    ),
  },
  {
    id: "owners", Icon: FaHandHoldingHeart, title: "For business owners",
    body: <p>You decide how to use your customers&apos; information in your dashboard. Please only contact customers in ways they would expect, respect anyone who asks you to delete their details, and keep your account password safe.</p>,
  },
  {
    id: "security", Icon: FaLock, title: "Keeping it safe",
    body: <p>Passwords are stored as one-way hashes, sign-in sessions expire, payment screenshots are only visible to our team, and each business can only see its own customers. No system is perfect, so please tell us straight away if you think your account has been misused.</p>,
  },
  {
    id: "keep", Icon: FaClock, title: "How long we keep it",
    body: <p>We keep account and customer information while your account is active. If you ask us to close your account, we delete your business data and customers&apos; details, except records we must keep for accounting or legal reasons, such as payment history.</p>,
  },
  {
    id: "rights", Icon: FaUserShield, title: "Your choices and rights",
    body: <p>You can see and edit most of your information in your dashboard. You can also ask us to send you a copy, correct it or delete it. Customers can ask the business, or contact us directly. We reply within 30 days.</p>,
  },
  {
    id: "children", Icon: FaChild, title: "Children",
    body: <p>{site.name} is made for businesses and adults. We don&apos;t knowingly collect information from children under 16.</p>,
  },
  {
    id: "changes", Icon: FaArrowsRotate, title: "Changes to this policy",
    body: <p>We may update this policy. The date at the top shows the latest version, and we&apos;ll tell account holders about important changes. See also our <Link href="/cookies">Cookie Policy</Link>.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage path="/privacy" title="Privacy Policy" updated="28 September 2026" summary={SUMMARY} sections={SECTIONS}
      intro="What we collect, why we collect it, and how you stay in control. In plain language."
      contact={{ title: "Questions about your data?", text: "Ask us to see, correct or delete your information at any time." }} />
  );
}
