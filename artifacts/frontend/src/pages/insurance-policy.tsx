import { Helmet } from "react-helmet-async";
import { FadeIn } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { Link } from "wouter";
import {
  ArrowLeft,
  Shield,
  AlertCircle,
  FileText,
  Clock,
  DollarSign,
  XCircle,
  CheckCircle,
  Mail,
} from "lucide-react";

const LAST_UPDATED = "May 1, 2026";

type PolicyBlock = {
  subtitle?: string;
  text?: string;
  list?: string[];
};

const SECTIONS: Array<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: PolicyBlock[];
}> = [
  {
    icon: Shield,
    title: "1. Shipment Protection Overview",
    content: [
      {
        text: "Shiprion offers shipment protection options to cover your goods against loss, theft, or damage during transit. All shipments automatically include basic carrier liability, and enhanced protection can be arranged with our operations team before offer acceptance:",
        list: [
          "Basic Carrier Liability: Included at no extra cost, covers up to $100 or €100 per shipment",
          "Standard Protection: Covers declared value up to $1,000 — ask our operations team to include it in the final offer",
          "Premium Protection: Covers declared value up to $10,000 — suitable for high-value goods",
          "Enterprise Coverage: Custom coverage for commercial shipments exceeding $10,000 — contact our team",
        ],
      },
      {
        subtitle: "Important Notice",
        text: "Carrier liability is not the same as insurance. Basic carrier liability is limited and may not cover the full value of your shipment or all types of loss. We strongly recommend purchasing additional protection for valuable items.",
      },
    ],
  },
  {
    icon: CheckCircle,
    title: "2. What Is Covered",
    content: [
      {
        subtitle: "Standard & Premium Protection Plans",
        text: "When you purchase a Standard or Premium Protection plan, the following are covered up to the declared value of the shipment:",
        list: [
          "Physical loss of the entire shipment during transit",
          "Damage caused by carrier mishandling, including crushing, puncturing, or dropping",
          "Theft of the shipment while in transit or at a carrier facility",
          "Partial loss where items within a package are missing upon delivery",
          "Water damage resulting from carrier handling or transit conditions (excluding weather events for basic tier)",
        ],
      },
    ],
  },
  {
    icon: XCircle,
    title: "3. What Is Not Covered",
    content: [
      {
        text: "The following are excluded from all shipment protection plans, regardless of the tier selected:",
        list: [
          "Damage resulting from inadequate or insufficient packaging by the sender",
          "Prohibited or restricted items as defined in our Shipping Policy",
          "Perishable goods that deteriorate during standard transit times",
          "Items with pre-existing damage at the time of shipment",
          "Consequential losses including loss of income, business interruption, or market value fluctuations",
          "Customs confiscation, seizure, or destruction by government authorities",
          "Delay in transit or missed delivery deadlines (unless Express Guarantee is purchased separately)",
          "Fragile items shipped without appropriate specialty packaging (e.g., electronics, glassware, artwork)",
          "Shipments with an incorrect or unverifiable declared value at the time of purchase",
        ],
      },
    ],
  },
  {
    icon: DollarSign,
    title: "4. Declared Value & Coverage Limits",
    content: [
      {
        subtitle: "Accurate Declared Value",
        text: "You are required to accurately declare the value of your shipment at the time of booking. The declared value must reflect the actual market value or replacement cost of the goods:",
        list: [
          "Undervaluing your shipment may result in a proportionally reduced payout in the event of a claim",
          "Overvaluing your shipment is considered fraud and will result in claim denial and possible account suspension",
          "Proof of purchase, appraisal certificates, or invoices may be required to substantiate declared values",
          "For commercial shipments, the invoice value plus freight and insurance costs determines the insurable value",
        ],
      },
      {
        subtitle: "Coverage Limits Per Plan",
        text: "Coverage is capped at the declared value up to the maximum for the selected plan. Claims exceeding the plan's maximum will be settled at the plan maximum, not the declared value.",
      },
    ],
  },
  {
    icon: FileText,
    title: "5. How to File a Claim",
    content: [
      {
        subtitle: "Step-by-Step Claims Process",
        text: "To submit a claim for a lost, stolen, or damaged shipment, follow these steps:",
        list: [
          "Step 1: Report the issue within 7 days of the delivery date (or expected delivery date for lost shipments) via your dashboard or by emailing claims@shiprion.com",
          "Step 2: Provide your tracking number, shipment details, and a detailed description of the loss or damage",
          "Step 3: Upload supporting documentation including photos of damage, original packaging, and proof of value",
          "Step 4: Our claims team will acknowledge your submission within 2 business days and assign a case number",
          "Step 5: An investigation will be conducted, which may involve carrier reports and delivery records",
          "Step 6: A decision will be communicated within 10–15 business days of receiving all required documentation",
        ],
      },
    ],
  },
  {
    icon: Clock,
    title: "6. Claims Timeframes & Deadlines",
    content: [
      {
        text: "All claims must be submitted within the following timeframes to be considered valid. Claims submitted after these deadlines will not be processed:",
        list: [
          "Visible damage: Report within 24 hours of delivery with photographic evidence",
          "Concealed damage (damage not visible externally): Report within 7 days of delivery",
          "Partial loss (missing items from a delivered package): Report within 7 days of delivery",
          "Total loss (shipment never delivered): Report within 7 days of the original estimated delivery date",
          "Documentation submission: All supporting documents must be received within 21 days of the initial claim report",
        ],
      },
      {
        subtitle: "Claim Outcome Timeline",
        text: "Once all documentation is received, Shiprion aims to resolve claims within 10–15 business days. Complex cases involving carrier investigations may take up to 30 business days.",
      },
    ],
  },
  {
    icon: AlertCircle,
    title: "7. Claim Denials & Appeals",
    content: [
      {
        subtitle: "Grounds for Denial",
        text: "A claim may be denied under the following circumstances:",
        list: [
          "The claimed item falls under a category explicitly excluded from coverage",
          "Insufficient or fraudulent documentation is provided",
          "The claim is submitted outside the permitted timeframe",
          "The damage is consistent with improper packaging rather than carrier mishandling",
          "The shipment's declared value cannot be substantiated with adequate proof",
          "The protection plan was not purchased prior to shipment dispatch",
        ],
      },
      {
        subtitle: "Appeals Process",
        text: "If your claim is denied and you believe this decision is incorrect, you may appeal within 14 days of the denial notice by submitting a written appeal with additional evidence to claims@shiprion.com. Appeals are reviewed by a senior claims adjuster and a final decision will be issued within 10 business days.",
      },
    ],
  },
  {
    icon: Shield,
    title: "8. Policy Amendments",
    content: [
      {
        text: "Shiprion reserves the right to update or amend this Insurance Policy at any time. Material changes will be communicated via email and posted on this page with an updated effective date. Continued use of our services following any amendments constitutes your acceptance of the revised policy.",
        list: [
          "Insurance terms and coverage limits are subject to change with 30 days' notice for existing plans",
          "New shipments are governed by the policy in effect at the time of booking",
          "Legacy claims (submitted before the amendment date) are processed under the terms in effect at time of shipment",
        ],
      },
    ],
  },
];

export default function InsurancePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Shipment Insurance Policy | Coverage & Claims — Shiprion</title>
        <meta
          name="description"
          content="Shiprion's Shipment Insurance Policy — protection plan tiers, what's covered, exclusions, how to file a claim, and timeframes for loss, damage, or theft during transit."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/insurance-policy" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Shipment Insurance Policy — Shiprion"
        />
        <meta
          property="og:description"
          content="Protection plan tiers, coverage details, exclusions, and step-by-step claims process for Shiprion shipments."
        />
        <meta
          property="og:url"
          content="https://shiprion.com/insurance-policy"
        />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta name="twitter:title" content="Insurance Policy — Shiprion" />
        <meta
          name="twitter:description"
          content="Shipment protection plans, coverage, exclusions, and claims process."
        />
      </Helmet>
      <PublicNavbar />
      <main className="px-4 sm:px-6 py-16 sm:py-20">
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
                  Insurance Policy
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-4 text-base leading-relaxed max-w-2xl">
              This policy describes Shiprion's shipment protection plans,
              coverage terms, exclusions, and the process for filing a claim in
              the event of loss, theft, or damage during transit.
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
                Need Help With a Claim?
              </h3>
              <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                Our claims team is available to guide you through the process
                and answer any questions about your shipment protection
                coverage.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold rounded-xl transition-colors glow-olive-sm"
                >
                  <Mail className="h-4 w-4" /> Contact Us
                </Link>
                <a
                  href="mailto:claims@shiprion.com"
                  className="text-sm text-olive-400 hover:text-olive-300 transition-colors"
                >
                  claims@shiprion.com
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
