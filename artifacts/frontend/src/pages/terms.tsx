import { Helmet } from "react-helmet-async";
import { FadeIn } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { Link } from "wouter";
import {
  ArrowLeft,
  FileText,
  Scale,
  Package,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Ban,
  Gavel,
  Globe,
  Mail,
} from "lucide-react";

const LAST_UPDATED = "May 1, 2026";

const SECTIONS = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    paragraphs: [
      'By accessing or using the Shiprion platform, website, mobile applications, or any related logistics services (collectively, the "Services"), you agree to be bound by these Terms and Conditions ("Terms"). If you are using the Services on behalf of a business or organization, you represent and warrant that you have the authority to bind that entity to these Terms.',
      "We reserve the right to update or modify these Terms at any time. Material changes will be communicated via email and/or a prominent notice on our platform at least 14 days before taking effect. Your continued use of the Services after the effective date constitutes your acceptance of the revised Terms. If you do not agree with any changes, you must discontinue use of the Services immediately.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "2. Account Registration & Security",
    paragraphs: [
      "To access certain features of our Services, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.",
    ],
    list: [
      "You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to create an account",
      "You agree to provide truthful, current, and complete information during registration and to update it as necessary",
      "You are responsible for all activity on your account, whether or not authorized by you",
      "You must notify us immediately at security@shiprion.com if you suspect unauthorized access to your account",
      "We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity",
      "Corporate accounts may designate authorized users; the account holder remains liable for all authorized user activity",
    ],
  },
  {
    icon: Package,
    title: "3. Shipment Services",
    paragraphs: [
      "Shiprion provides logistics services including domestic and international shipping, package tracking, customs brokerage, and freight forwarding. By submitting a shipment order, you agree to the following:",
    ],
    list: [
      "All shipment details (contents, weight, dimensions, declared value) must be accurate and complete",
      "You are responsible for proper packaging of items to prevent damage during transit",
      "Prohibited and restricted items (as outlined in Section 8) must not be shipped under any circumstances",
      "Delivery timeframes are estimates and may vary due to weather, customs processing, carrier delays, or force majeure",
      "Shiprion acts as a logistics intermediary and may utilize third-party carriers to fulfill shipment orders",
      "Signature confirmation may be required for high-value shipments exceeding $500 in declared value",
      "You authorize Shiprion and its carrier partners to open and inspect packages if required by customs authorities",
    ],
  },
  {
    icon: CreditCard,
    title: "4. Pricing & Quote Confirmation",
    paragraphs: [
      "Estimates are calculated from the shipment weight and selected service. A shipment is not created until Shiprion reviews the request, publishes a final offer, and the customer accepts it.",
    ],
    list: [
      "Prices displayed at the time of booking are estimates; final charges may vary based on actual weight and dimensions verified at our facilities",
      "Additional surcharges may apply for fuel, remote area delivery, residential delivery, oversized packages, or hazardous materials handling",
      "The Shiprion portal does not process payments; any commercial settlement is coordinated directly with Shiprion operations",
      "Customs duties, import taxes, and brokerage fees for international shipments are the responsibility of the recipient unless otherwise arranged",
    ],
  },
  {
    icon: AlertTriangle,
    title: "5. Liability & Claims",
    paragraphs: [
      "While we take every precaution to ensure safe delivery of your shipments, our liability is limited as follows:",
    ],
    list: [
      "Maximum liability for lost or damaged domestic shipments is limited to the declared value or $100 per package, whichever is lower, unless additional insurance is purchased",
      "Maximum liability for international shipments is governed by the applicable international convention (Warsaw Convention, Montreal Convention, or CMR Convention)",
      "Claims for lost or damaged shipments must be filed within 21 days of the expected delivery date with supporting documentation",
      "We are not liable for delays caused by incorrect shipping information, customs holds, natural disasters, or other force majeure events",
      "Consequential, indirect, incidental, or punitive damages are excluded to the maximum extent permitted by law",
      "Ask Shiprion operations about additional shipment protection before accepting an offer for high-value items",
      "Claims are processed within 10 business days of receiving all required documentation",
    ],
  },
  {
    icon: Truck,
    title: "6. Delivery & Returns",
    paragraphs: [
      "We strive to deliver all shipments within the estimated timeframe selected at booking. The following policies apply:",
    ],
    list: [
      "Delivery attempts: we make up to 3 delivery attempts before holding the package at the nearest facility for 7 business days",
      "Unclaimed packages after the 7-day hold period may be returned to sender at the sender's expense",
      "Address corrections requested after shipment dispatch incur a $15 redirect fee per package",
      "Refused deliveries are returned to sender with return shipping charges deducted from any applicable refund",
      "Proof of delivery (signature, photo, or GPS confirmation) constitutes completion of the delivery obligation",
      "For shipments marked as delivered but not received, an investigation is initiated within 24 hours of the claim",
    ],
  },
  {
    icon: Scale,
    title: "7. Intellectual Property",
    paragraphs: [
      "All content, trademarks, logos, software, and technology on the Shiprion platform are owned by or licensed to Shiprion Logistics Inc. and protected by intellectual property laws.",
    ],
    list: [
      "The Shiprion name, logo, and all related marks are registered trademarks of Shiprion Logistics Inc.",
      "You may not copy, modify, distribute, or create derivative works from any part of our platform without prior written consent",
      "API access is granted under a separate API License Agreement and subject to rate limits and usage policies",
      "User-generated content (reviews, feedback) grants Shiprion a non-exclusive, royalty-free license to use for service improvement",
      "Any unauthorized use of our intellectual property may result in legal action and account termination",
    ],
  },
  {
    icon: Ban,
    title: "8. Prohibited Items & Activities",
    paragraphs: [
      "The following items and activities are strictly prohibited on the Shiprion platform:",
    ],
    list: [
      "Hazardous materials, explosives, flammable substances, and radioactive materials (unless through our certified HazMat service)",
      "Illegal drugs, controlled substances, and drug paraphernalia",
      "Weapons, firearms, ammunition, and military equipment (unless properly licensed and documented)",
      "Counterfeit goods, stolen property, or items that infringe on intellectual property rights",
      "Live animals (except through our specialized animal transport service with veterinary certification)",
      "Currency, bearer instruments, and negotiable securities in amounts exceeding $10,000",
      "Items prohibited by the origin or destination country's import/export regulations",
      "Using the platform for money laundering, terrorist financing, or any other illegal purpose",
    ],
  },
  {
    icon: Gavel,
    title: "9. Dispute Resolution",
    paragraphs: [
      "In the event of a dispute arising from or relating to these Terms or your use of the Services:",
    ],
    list: [
      "We encourage you to first contact our support team to resolve the matter informally within 30 days",
      "If informal resolution fails, disputes will be submitted to binding arbitration under the rules of the American Arbitration Association (AAA)",
      "Arbitration shall take place in New York, New York, or remotely via video conference at your election",
      "Class action lawsuits and class-wide arbitration are waived; all disputes must be resolved on an individual basis",
      "Small claims court actions (under $10,000) may be filed in any court of competent jurisdiction as an alternative to arbitration",
      "These Terms are governed by the laws of the State of New York, without regard to conflict of law principles",
      "Any claims must be brought within one (1) year after the cause of action arises",
    ],
  },
  {
    icon: Globe,
    title: "10. International Terms",
    paragraphs: [
      "For users outside the United States, the following additional terms apply:",
    ],
    list: [
      "EU/EEA users: you have additional rights under the General Data Protection Regulation (GDPR) as outlined in our Privacy Policy",
      "UK users: these Terms are supplemented by the UK Consumer Rights Act 2015 where applicable",
      "Canadian users: these Terms comply with the Personal Information Protection and Electronic Documents Act (PIPEDA)",
      "Australian users: nothing in these Terms excludes or limits consumer guarantees under Australian Consumer Law",
      "For all international users: local consumer protection laws apply where they provide greater protection than these Terms",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Helmet>
        <title>Terms & Conditions — Shiprion</title>
        <meta
          name="description"
          content="Shiprion's Terms & Conditions — the rules, rights, and responsibilities governing use of our logistics platform, shipment services, and accounts."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Terms & Conditions — Shiprion" />
        <meta
          property="og:description"
          content="Shiprion's Terms & Conditions governing use of our logistics platform, shipment services, billing, and accounts."
        />
        <meta property="og:url" content="https://shiprion.com/terms" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta name="twitter:title" content="Terms & Conditions — Shiprion" />
        <meta
          name="twitter:description"
          content="Rules and policies governing use of Shiprion's logistics platform and services."
        />
      </Helmet>

      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-olive-500/[0.04] blur-[120px] pointer-events-none animate-orb" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-olive-500/[0.03] blur-[100px] pointer-events-none animate-orb-alt" />

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
                <Scale className="h-6 w-6 text-olive-400" />
              </div>
              <div>
                <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
                  Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Terms & Conditions
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-4 text-base leading-relaxed max-w-2xl">
              These terms govern your use of the Shiprion logistics platform and
              all related services. Please read them carefully before using our
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
                    <div className="space-y-4">
                      {section.paragraphs.map((p, j) => (
                        <p
                          key={j}
                          className="text-gray-500 text-sm leading-relaxed"
                        >
                          {p}
                        </p>
                      ))}
                      {section.list && (
                        <ul className="space-y-2 ml-1">
                          {section.list.map((item, k) => (
                            <li
                              key={k}
                              className="flex items-start gap-2.5 text-sm text-gray-500"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-olive-500/40 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
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
                Have Questions About These Terms?
              </h3>
              <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                Our legal team is available to clarify any part of these terms.
                Reach out anytime.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold rounded-xl transition-colors glow-olive-sm"
              >
                <Mail className="h-4 w-4" /> Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
