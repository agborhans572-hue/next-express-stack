import { Helmet } from "react-helmet-async";
import { FadeIn } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { Link } from "wouter";
import {
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Lock,
  Globe,
  UserCheck,
  Mail,
  FileText,
} from "lucide-react";

const LAST_UPDATED = "May 1, 2026";

type PrivacyBlock = {
  subtitle?: string;
  text?: string;
  list?: string[];
};

const SECTIONS: Array<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: PrivacyBlock[];
}> = [
  {
    icon: Eye,
    title: "1. Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        text: "When you create an account, place a shipment order, or contact our support team, we may collect the following personal information:",
        list: [
          "Full name, email address, phone number, and mailing address",
          "Quote, service-rate, and agreed-offer information",
          "Government-issued identification (for customs and international shipments where required by law)",
          "Business name, tax identification number, and commercial invoicing details for corporate accounts",
        ],
      },
      {
        subtitle: "Shipment Information",
        text: "To fulfill our logistics services, we collect:",
        list: [
          "Sender and recipient names, addresses, phone numbers, and email addresses",
          "Package dimensions, weight, declared value, and contents description",
          "Preferred shipping methods, delivery instructions, and scheduling preferences",
          "Customs declarations and export/import documentation for international shipments",
        ],
      },
      {
        subtitle: "Technical Information",
        text: "When you use our website or mobile applications, we automatically collect:",
        list: [
          "IP address, browser type, operating system, and device identifiers",
          "Pages visited, time spent on each page, click patterns, and referral sources",
          "Location data (with your consent) for delivery optimization and local service recommendations",
          "Error logs and performance data to improve platform reliability",
        ],
      },
    ],
  },
  {
    icon: Database,
    title: "2. How We Use Your Information",
    content: [
      {
        text: "We use the information we collect for the following purposes:",
        list: [
          "Processing and fulfilling your shipment orders, including real-time tracking and delivery notifications",
          "Communicating with you about order status, service updates, account notifications, and support inquiries",
          "Verifying your identity and preventing fraudulent activity across our platform",
          "Calculating shipping estimates and preparing reviewed service offers",
          "Improving our services through analytics, AI-powered route optimization, and demand forecasting",
          "Complying with legal obligations including customs regulations, trade compliance, and tax reporting",
          "Sending promotional communications about new services and features (with your opt-in consent)",
          "Personalizing your experience with recommended services based on your shipment history",
        ],
      },
    ],
  },
  {
    icon: UserCheck,
    title: "3. Information Sharing & Disclosure",
    content: [
      {
        text: "We do not sell your personal information. We may share information with the following parties strictly to provide our services:",
        list: [
          "Carrier partners and logistics providers who transport your packages (DHL, FedEx, UPS, local couriers)",
          "Customs authorities and government agencies as required by law for international shipments",
          "Cloud hosting and infrastructure providers (AWS, Google Cloud) who store data under strict contracts",
          "Analytics services that help us improve platform performance (in anonymized/aggregated form only)",
          "Legal authorities when required by valid court orders, subpoenas, or to protect our legal rights",
          "Business partners in the event of a merger, acquisition, or asset sale (with prior notice to users)",
        ],
      },
    ],
  },
  {
    icon: Lock,
    title: "4. Data Security",
    content: [
      {
        text: "We implement industry-standard security measures to protect your information:",
        list: [
          "AES-256 encryption for data at rest and TLS 1.3 for all data in transit",
          "Multi-factor authentication (MFA) available for all user accounts",
          "Regular penetration testing and vulnerability assessments by independent security firms",
          "SOC 2 Type II certified data centers with 24/7 physical security and monitoring",
          "Role-based access controls ensuring employees only access data necessary for their job functions",
          "Automated intrusion detection and real-time alerting for suspicious activity",
          "Regular employee security training and background checks for staff handling sensitive data",
        ],
      },
    ],
  },
  {
    icon: Globe,
    title: "5. International Data Transfers",
    content: [
      {
        text: "As a global logistics provider operating in 180+ countries, your data may be transferred internationally. We ensure compliance through:",
        list: [
          "EU Standard Contractual Clauses (SCCs) for transfers outside the European Economic Area",
          "Compliance with the UK International Data Transfer Agreement for UK residents",
          "Data Processing Agreements with all third-party processors requiring equivalent protections",
          "Privacy Shield principles for US-based data handling where applicable",
          "Regional data residency options available for enterprise clients with specific jurisdictional requirements",
        ],
      },
    ],
  },
  {
    icon: Shield,
    title: "6. Your Rights & Choices",
    content: [
      {
        text: "Depending on your jurisdiction, you have the following rights regarding your personal data:",
        list: [
          "Access: Request a copy of all personal data we hold about you in a portable format",
          "Correction: Update or correct inaccurate personal information at any time",
          "Deletion: Request erasure of your data (subject to legal retention requirements for shipment records)",
          "Restriction: Limit processing of your data while we resolve any disputes or verify accuracy",
          "Portability: Receive your data in a structured, machine-readable format for transfer to another service",
          "Objection: Opt out of direct marketing and automated decision-making at any time",
          "Withdrawal: Revoke previously given consent without affecting the lawfulness of prior processing",
        ],
      },
      {
        text: "To exercise any of these rights, contact our Data Protection Officer at privacy@shiprion.com or through the Contact Us page. We respond to all verified requests within 30 days.",
      },
    ],
  },
  {
    icon: FileText,
    title: "7. Data Retention",
    content: [
      {
        text: "We retain your data for as long as necessary to provide our services and comply with legal obligations:",
        list: [
          "Active account data: retained for the duration of your account plus 30 days after deletion request",
          "Shipment records: retained for 7 years as required by customs and trade compliance regulations",
          "Financial and billing data: retained for 7 years per tax and accounting regulations",
          "Support correspondence: retained for 3 years from the date of last interaction",
          "Technical logs and analytics: retained for 12 months in identifiable form, then anonymized",
          "Marketing consent records: retained for the duration of consent plus 3 years after withdrawal",
        ],
      },
    ],
  },
  {
    icon: Shield,
    title: "8. Children's Privacy",
    content: [
      {
        text: "Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we discover that we have inadvertently collected data from a child under 16, we will promptly delete it and notify the relevant parent or guardian. If you believe a child has provided us with personal data, please contact us immediately at privacy@shiprion.com.",
      },
    ],
  },
  {
    icon: FileText,
    title: "9. Changes to This Policy",
    content: [
      {
        text: "We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or regulatory guidance. When we make material changes, we will notify you via email and/or a prominent notice on our platform at least 30 days before the changes take effect. Your continued use of our services after the effective date constitutes acceptance of the updated policy. We encourage you to review this page regularly.",
      },
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Helmet>
        <title>Privacy Policy — Shiprion</title>
        <meta
          name="description"
          content="Shiprion's Privacy Policy — how we collect, use, store, and protect your personal data in compliance with GDPR and international privacy regulations."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/privacy" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Privacy Policy — Shiprion" />
        <meta
          property="og:description"
          content="Learn how Shiprion collects, uses, and protects your personal information across our logistics platform."
        />
        <meta property="og:url" content="https://shiprion.com/privacy" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta name="twitter:title" content="Privacy Policy — Shiprion" />
        <meta
          name="twitter:description"
          content="How Shiprion collects, uses, and protects your personal data."
        />
      </Helmet>

      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-olive-500/[0.04] blur-[120px] pointer-events-none animate-orb" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-olive-500/[0.03] blur-[100px] pointer-events-none animate-orb-alt" />

      <PublicNavbar />

      <main className="relative z-[1] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-olive-400 transition-colors mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-olive-500/10 border border-olive-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-olive-400" />
              </div>
              <div>
                <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
                  Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Privacy Policy
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-4 text-base leading-relaxed max-w-2xl">
              At Shiprion, your privacy is fundamental to our business. This
              policy explains how we collect, use, store, and protect your
              personal information when you use our logistics platform and
              services.
            </p>
            <p className="text-gray-500 text-sm mt-3">
              Last updated: {LAST_UPDATED}
            </p>
          </FadeIn>

          <div className="mt-12 space-y-6">
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <FadeIn key={section.title} delay={0.08 + i * 0.03}>
                  <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-lg bg-olive-500/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-olive-400" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-5">
                      {section.content.map((block, j) => (
                        <div key={j}>
                          {block.subtitle && (
                            <h3 className="text-sm font-semibold text-olive-400 mb-2">
                              {block.subtitle}
                            </h3>
                          )}
                          {block.text && (
                            <p className="text-gray-500 text-sm leading-relaxed mb-3">
                              {block.text}
                            </p>
                          )}
                          {block.list && (
                            <ul className="space-y-2 ml-1">
                              {block.list.map((item, k) => (
                                <li
                                  key={k}
                                  className="flex items-start gap-2.5 text-sm text-gray-500"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-olive-500/40 mt-1.5 shrink-0" />
                                  <span className="leading-relaxed">
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-12 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
              <Mail className="h-6 w-6 text-olive-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Questions About Your Privacy?
              </h3>
              <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                Our Data Protection Officer is available to address any concerns
                or requests regarding your personal data.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold rounded-xl transition-colors glow-olive-sm"
                >
                  <Mail className="h-4 w-4" /> Contact Us
                </Link>
                <a
                  href="mailto:privacy@shiprion.com"
                  className="text-sm text-olive-400 hover:text-olive-300 transition-colors"
                >
                  privacy@shiprion.com
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
