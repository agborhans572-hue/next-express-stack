import { Helmet } from "react-helmet-async";
import { FadeIn } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { Link } from "wouter";
import {
  ArrowLeft,
  Truck,
  Clock,
  Globe,
  Package,
  AlertCircle,
  RefreshCw,
  Scale,
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
    icon: Globe,
    title: "1. Shipping Destinations",
    content: [
      {
        text: "Shiprion provides shipping services to over 180 countries and territories worldwide. Delivery availability may be subject to:",
        list: [
          "Local import/export regulations and customs requirements at the destination",
          "Carrier network availability in remote or restricted areas",
          "Embargoes, trade sanctions, or government-imposed shipping restrictions",
          "Force majeure events including natural disasters, strikes, or civil unrest",
        ],
      },
      {
        subtitle: "Restricted Destinations",
        text: "We reserve the right to decline shipments to certain destinations where compliance cannot be guaranteed or where international trade regulations prohibit delivery.",
      },
    ],
  },
  {
    icon: Clock,
    title: "2. Delivery Timeframes",
    content: [
      {
        subtitle: "Estimated Delivery Times",
        text: "Delivery estimates are provided at the time of booking and are based on standard transit times. These are estimates only and are not guaranteed unless an express service with guaranteed delivery is selected:",
        list: [
          "Domestic Standard: 2–5 business days",
          "Domestic Express: 1–2 business days",
          "International Economy: 7–21 business days depending on destination",
          "International Priority: 3–7 business days depending on destination",
          "International Express: 1–3 business days to major cities",
        ],
      },
      {
        subtitle: "Factors Affecting Delivery",
        text: "Actual delivery times may vary due to the following factors:",
        list: [
          "Customs clearance delays at origin or destination countries",
          "Incorrect or incomplete recipient address information",
          "Failed delivery attempts due to recipient unavailability",
          "Public holidays, peak shipping seasons, or carrier network disruptions",
          "Weather events or other force majeure circumstances beyond our control",
        ],
      },
    ],
  },
  {
    icon: Package,
    title: "3. Packaging Requirements",
    content: [
      {
        text: "Proper packaging is the sender's responsibility. Shiprion recommends the following to ensure safe transit:",
        list: [
          "Use a sturdy, corrugated cardboard box in good condition with no prior labels or markings",
          "Wrap fragile items individually with at least 5 cm of cushioning material on all sides",
          "Fill empty spaces inside the box with bubble wrap, foam peanuts, or crumpled paper",
          "Seal all seams with pressure-sensitive plastic tape at least 5 cm wide",
          "Place a duplicate address label inside the package in case the outer label becomes detached",
          "Do not use string, rope, or paper wrapping on the outside of the package",
        ],
      },
      {
        subtitle: "Packaging Liability",
        text: "Claims for damage caused by inadequate packaging may be denied. Shiprion is not liable for damage resulting from packaging that does not meet the above standards or carrier guidelines.",
      },
    ],
  },
  {
    icon: AlertCircle,
    title: "4. Prohibited & Restricted Items",
    content: [
      {
        subtitle: "Absolutely Prohibited Items",
        text: "The following items are strictly prohibited and will not be accepted under any circumstances:",
        list: [
          "Explosives, firearms, ammunition, and weaponry of any kind",
          "Illegal narcotics, controlled substances, and drug paraphernalia",
          "Counterfeit currency, documents, or goods infringing on intellectual property",
          "Human remains, body parts, or organs (except under specific medical licensing)",
          "Radioactive, biological, or chemical hazardous materials without proper certification",
          "Live animals (except via approved veterinary courier services)",
        ],
      },
      {
        subtitle: "Conditionally Restricted Items",
        text: "The following items may require special permits, declarations, or carrier approval prior to shipping:",
        list: [
          "Lithium batteries and electronics with built-in battery packs",
          "Perishable goods, food items, and temperature-sensitive products",
          "Alcoholic beverages, tobacco products, and e-cigarettes",
          "Medical devices, pharmaceuticals, and health supplements",
          "Artwork, antiques, and collectibles valued over $5,000",
          "Precious metals, gemstones, and jewelry above declared value thresholds",
        ],
      },
    ],
  },
  {
    icon: Scale,
    title: "5. Weight & Dimension Limits",
    content: [
      {
        text: "All shipments are subject to the following standard size and weight restrictions. Oversized or overweight items may incur additional surcharges or require special freight arrangements:",
        list: [
          "Maximum weight per parcel: 70 kg (154 lbs) for standard services",
          "Maximum length of any single side: 120 cm (47 inches)",
          "Maximum combined dimensions (length + 2× width + 2× height): 300 cm (118 inches)",
          "Portal estimates use actual weight within the selected service's supported range",
        ],
      },
      {
        subtitle: "Final handling review",
        text: "Dimensions and handling requirements may affect the final reviewed offer even though the portal estimate is based on actual weight. Include accurate cargo dimensions and notes with your request.",
      },
    ],
  },
  {
    icon: Truck,
    title: "6. Tracking & Delivery Confirmation",
    content: [
      {
        text: "All Shiprion shipments include real-time tracking from collection to delivery:",
        list: [
          "Tracking numbers are issued upon shipment creation and sent to the recipient's email",
          "Live status updates are available at shiprion.com/track using the tracking number",
          "In-app and email notifications are sent for key account and transit events",
          "Private proof-of-delivery photos or documents are available to the shipment customer and authorized staff",
          "Delivery attempts are recorded and available in your tracking history",
        ],
      },
      {
        subtitle: "Failed Delivery Attempts",
        text: "If a delivery attempt is unsuccessful, the carrier will typically leave a notification card. After three failed attempts, the shipment may be returned to the sender or held at a local depot for collection for up to 7 business days before being returned.",
      },
    ],
  },
  {
    icon: RefreshCw,
    title: "7. Returns & Undeliverable Shipments",
    content: [
      {
        subtitle: "Return Shipments",
        text: "Return shipping must be arranged separately and is subject to standard shipping rates. To initiate a return:",
        list: [
          "Contact our support team or use the self-service returns portal in your dashboard",
          "A return label will be generated and sent to the recipient or sender as appropriate",
          "Return shipments are subject to the same packaging and prohibited items policies",
          "Return transit times mirror outbound estimates for the same service level",
        ],
      },
      {
        subtitle: "Undeliverable Shipments",
        text: "Shipments that cannot be delivered due to incorrect addresses, refusal by the recipient, or regulatory issues will be returned to the sender. Return shipping costs are the sender's responsibility unless the issue arose from a Shiprion error.",
      },
    ],
  },
];

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>
          Shipping Policy | Delivery, Packaging & Restrictions — Shiprion
        </title>
        <meta
          name="description"
          content="Shiprion's Shipping Policy — destinations, estimated delivery timeframes, packaging requirements, prohibited items, weight limits, tracking, and return procedures."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/shipping-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shipping Policy — Shiprion" />
        <meta
          property="og:description"
          content="Everything you need to know about shipping with Shiprion — destinations, delivery times, packaging, restrictions, and returns."
        />
        <meta
          property="og:url"
          content="https://shiprion.com/shipping-policy"
        />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta name="twitter:title" content="Shipping Policy — Shiprion" />
        <meta
          name="twitter:description"
          content="Destinations, timeframes, packaging requirements, prohibited items, and delivery procedures."
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
                <Truck className="h-6 w-6 text-olive-400" />
              </div>
              <div>
                <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
                  Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Shipping Policy
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-4 text-base leading-relaxed max-w-2xl">
              This policy outlines Shiprion's shipping guidelines, delivery
              timeframes, packaging requirements, and procedures governing all
              shipments processed through our logistics platform.
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
                Questions About Shipping?
              </h3>
              <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                Our logistics team is ready to help with any questions about
                shipping requirements, restrictions, or service options.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold rounded-xl transition-colors glow-olive-sm"
                >
                  <Mail className="h-4 w-4" /> Contact Us
                </Link>
                <a
                  href="mailto:support@shiprion.com"
                  className="text-sm text-olive-400 hover:text-olive-300 transition-colors"
                >
                  support@shiprion.com
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
