import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { Link } from "wouter";
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  Package,
  Truck,
  CreditCard,
  Globe,
  ShieldCheck,
  Headphones,
  Search,
  Mail,
  ArrowRight,
} from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Shipping & Delivery",
    icon: Truck,
    items: [
      {
        q: "What shipping services does Shiprion offer?",
        a: "We offer a comprehensive range of logistics solutions including Express Air Freight (1–3 business days), Standard Road Freight (3–7 business days), Ocean Freight for bulk cargo, same-day local delivery in select metro areas, and specialized services for fragile, temperature-controlled, and oversized items. Our AI-powered routing engine automatically selects the optimal combination of carriers and routes for each shipment.",
      },
      {
        q: "How long does delivery take?",
        a: "Delivery times depend on the service level, origin, and destination. Express Air: 1–3 business days for domestic, 2–5 for international. Standard Road: 3–7 business days domestically. Ocean Freight: 15–45 days depending on the route. Same-day delivery is available in over 50 metropolitan areas. All timeframes are estimates and may vary due to customs processing, weather conditions, or peak season volumes.",
      },
      {
        q: "Do you deliver to P.O. Boxes or military addresses?",
        a: "Yes, we deliver to P.O. Boxes via USPS integration and to APO/FPO/DPO military addresses. Please note that delivery to these addresses may take longer than standard deliveries and some restrictions on package size and contents may apply. Express and same-day services are not available for P.O. Box or military address deliveries.",
      },
      {
        q: "What happens if I'm not home for delivery?",
        a: "Delivery-attempt handling depends on the assigned carrier and route. Follow the tracking timeline and contact support if an attempt is missed; our team will confirm the available redelivery, collection, or return options.",
      },
      {
        q: "Can I schedule a specific delivery time?",
        a: "Yes, our Premium Delivery service lets you choose a 2-hour delivery window for domestic shipments. Standard deliveries are made between 8 AM and 8 PM local time. For business deliveries, you can specify morning-only (before 12 PM) or afternoon-only delivery windows at no extra charge.",
      },
    ],
  },
  {
    title: "Tracking & Notifications",
    icon: Package,
    items: [
      {
        q: "How do I track my shipment?",
        a: "You can track a shipment using its tracking number on the Track Order page. Public tracking shows privacy-safe status history and the estimated delivery date; signed-in customers can also open shipments assigned to their account.",
      },
      {
        q: "What tracking notifications will I receive?",
        a: "You'll receive in-app and email notifications for quote offers, shipment assignment, status changes, delivery, and support replies. Public tracking shows the shipment timeline, while signed-in customers can review their full account history.",
      },
      {
        q: "My tracking hasn't updated in over 24 hours. What should I do?",
        a: "Occasional gaps in tracking updates can occur during international customs processing, carrier facility transfers, or in areas with limited scanner coverage. If your tracking hasn't updated in 48+ hours for domestic shipments or 72+ hours for international shipments, please contact our support team. We'll investigate with the carrier and provide you with an update within 24 hours.",
      },
      {
        q: "Can I track multiple shipments at once?",
        a: "Yes! Your dashboard provides a centralized view of all your active shipments with live status updates, interactive maps, and batch tracking capabilities. Corporate accounts also have access to our Analytics Dashboard with aggregate tracking metrics, delivery performance reports, and custom alerts for delayed shipments.",
      },
    ],
  },
  {
    title: "Pricing & Quotes",
    icon: CreditCard,
    items: [
      {
        q: "How are shipping rates calculated?",
        a: "The calculator uses the selected active service rate, actual weight, base fee, per-kilogram fee, and fuel percentage. Each request keeps that rate snapshot, and operations reviews the details before publishing a final offer.",
      },
      {
        q: "Can I pay through the Shiprion portal?",
        a: "The Shiprion portal does not collect online payments. Submit a quote request and our operations team will confirm the final offer and coordinate commercial arrangements with you directly.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No. Your portal displays the service estimate and the reviewed final offer before you accept it. Customs duties and import taxes may still be assessed by destination-country authorities, and any exceptional handling or redelivery costs are confirmed by our operations team before work proceeds.",
      },
      {
        q: "Can I get a refund if my package is delayed?",
        a: "Delivery dates shown in the portal are estimates unless your written offer states otherwise. Contact support with the tracking number for a delayed shipment; any service credit or commercial adjustment is reviewed and coordinated outside the portal.",
      },
      {
        q: "Do you offer volume discounts for businesses?",
        a: "Yes, we offer tiered volume discounts for businesses shipping regularly. Discounts start at 10% for 50+ shipments per month and scale up to 35% for enterprise clients shipping 1,000+ packages monthly. Contact our sales team for a custom quote tailored to your shipping patterns, routes, and volume.",
      },
    ],
  },
  {
    title: "International Shipping",
    icon: Globe,
    items: [
      {
        q: "Which countries do you ship to?",
        a: "Shiprion operates across major global trade corridors. Some destinations restrict certain goods; include complete cargo details in your quote request so our operations team can confirm route availability and handling requirements.",
      },
      {
        q: "Who pays customs duties and import taxes?",
        a: "By default, customs duties and import taxes are the responsibility of the recipient unless your written offer states otherwise. Ask our operations team about duty-handling options when requesting a quote; the portal does not calculate or collect duties at checkout.",
      },
      {
        q: "What customs documentation do I need?",
        a: "For most international shipments, you'll need a Commercial Invoice (we auto-generate this based on your shipment details), a packing list, and any product-specific certificates (e.g., certificates of origin, phytosanitary certificates, FDA approvals). Our system automatically generates the required customs documentation based on your shipment details and destination country requirements.",
      },
      {
        q: "How long does customs clearance take?",
        a: "Most shipments clear customs within 1–3 business days. However, clearance times can vary significantly depending on the destination country, the type of goods, the completeness and accuracy of documentation, and current inspection volumes. High-risk or unusual goods may require physical inspection, adding 2–5 additional days. Our customs brokerage team monitors all international shipments and proactively resolves any holds.",
      },
    ],
  },
  {
    title: "Insurance & Claims",
    icon: ShieldCheck,
    items: [
      {
        q: "Is my shipment insured?",
        a: "All shipments include basic carrier liability coverage up to $100 per package. For higher-value items, we offer optional premium insurance that covers the full declared value of your goods. Insurance rates start at $2.50 per $100 of declared value. We strongly recommend purchasing additional coverage for items valued over $100 — the peace of mind is well worth the small additional cost.",
      },
      {
        q: "How do I file a claim for lost or damaged goods?",
        a: "Contact support with your tracking number, photos of any damage, proof of the item's value, and a description of the contents. Claims are handled by the operations team outside the portal; the dashboard does not issue automated refunds.",
      },
      {
        q: "What items are not covered by insurance?",
        a: "Our insurance does not cover: perishable goods that spoil due to transit time, inherent vice (items that deteriorate naturally), inadequate packaging by the sender, items prohibited under our shipping terms, pre-existing damage, and losses caused by natural disasters or acts of war. Electronics and fragile items are covered but require appropriate protective packaging as a condition of the claim.",
      },
    ],
  },
  {
    title: "Account & Support",
    icon: Headphones,
    items: [
      {
        q: "How do I create an account?",
        a: "Click 'Get Started' on our homepage or visit the registration page. You'll need a valid email address and a password. After registration, verify your email address using the 6-digit code we send you. Once verified, you can request and accept quotes, access assigned shipments, and manage your profile.",
      },
      {
        q: "How can I contact customer support?",
        a: "We offer multiple support channels: Live Chat (available 24/7 on your dashboard and our website), Email (support@shiprion.com — response within 4 hours), Phone (+1-478-500-1234 — available Mon–Sat, 6 AM – 10 PM EST), and our Contact Form on the website. Enterprise clients have access to a dedicated account manager and priority support line.",
      },
      {
        q: "Can I change or cancel a shipment after booking?",
        a: "Contact support as soon as possible. Operations staff can cancel a nonterminal shipment or advise whether route and address changes remain possible. Any commercial adjustment is coordinated directly rather than refunded through the portal.",
      },
      {
        q: "Do you offer an API for developers?",
        a: "Shiprion uses a documented REST API for account, quote, shipment, tracking, notification, and support workflows. Public developer access, SDKs, label generation, and webhooks are not offered in this release.",
      },
    ],
  },
];

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 py-4 px-1 text-left group"
      >
        <HelpCircle
          className={`h-4 w-4 mt-0.5 shrink-0 transition-colors ${isOpen ? "text-olive-400" : "text-gray-600 group-hover:text-gray-500"}`}
        />
        <span
          className={`flex-1 text-sm font-medium transition-colors ${isOpen ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}
        >
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown
            className={`h-4 w-4 transition-colors ${isOpen ? "text-olive-400" : "text-gray-600"}`}
          />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 text-sm leading-relaxed pb-4 pl-7 pr-4">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !searchQuery.trim() ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  })).filter((cat) => cat.items.length > 0);

  const totalQuestions = FAQ_CATEGORIES.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Helmet>
        <title>FAQ | Frequently Asked Questions — Shiprion</title>
        <meta
          name="description"
          content="Get answers to common questions about Shiprion shipping services, real-time tracking, pricing, international freight, insurance, and customer support."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/faq" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="FAQ | Frequently Asked Questions — Shiprion"
        />
        <meta
          property="og:description"
          content="Answers to the most common questions about Shiprion's shipping services, tracking, pricing, insurance, and support."
        />
        <meta property="og:url" content="https://shiprion.com/faq" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta property="og:image:alt" content="Shiprion FAQ" />
        <meta name="twitter:title" content="FAQ — Shiprion" />
        <meta
          name="twitter:description"
          content="Answers to common questions about shipping, tracking, pricing, and support at Shiprion."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            url: "https://shiprion.com/faq",
            mainEntity: [
              {
                "@type": "Question",
                name: "What shipping services does Shiprion offer?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We offer Express Air Freight (1–3 business days), Standard Road Freight (3–7 business days), Ocean Freight for bulk cargo, same-day local delivery in select metro areas, and specialized services for fragile, temperature-controlled, and oversized items.",
                },
              },
              {
                "@type": "Question",
                name: "How do I track my shipment?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Visit our Track Order page at shiprion.com/track and enter your tracking number to see the public shipment status, estimated delivery date, and privacy-safe tracking timeline.",
                },
              },
              {
                "@type": "Question",
                name: "How are shipping rates calculated?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Estimates use the selected active service-rate version, actual weight, base fee, per-kilogram fee, and fuel percentage. Operations reviews the request before publishing a final offer.",
                },
              },
              {
                "@type": "Question",
                name: "What payment methods do you accept?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The Shiprion portal does not collect online payments. Final commercial arrangements are coordinated directly with Shiprion operations.",
                },
              },
              {
                "@type": "Question",
                name: "Do you ship internationally?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, Shiprion ships to over 180 countries and territories. International Economy takes 7–21 business days, International Priority 3–7 days, and International Express 1–3 days to major cities.",
                },
              },
              {
                "@type": "Question",
                name: "What happens if my package is lost or damaged?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Coverage and claims are coordinated directly with Shiprion operations. The portal does not sell protection plans or process claim payments at checkout.",
                },
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-olive-500/[0.04] blur-[120px] pointer-events-none animate-orb" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-olive-500/[0.03] blur-[100px] pointer-events-none animate-orb-alt" />

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
                <HelpCircle className="h-6 w-6 text-olive-400" />
              </div>
              <div>
                <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
                  Support
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Frequently Asked Questions
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-4 text-base leading-relaxed max-w-2xl">
              Find answers to {totalQuestions} common questions about our
              shipping services, tracking, pricing, international logistics, and
              more.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-olive-500/50 focus:ring-1 focus:ring-olive-500/20 transition-all"
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="mt-6 flex flex-wrap gap-2">
              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.title}
                    onClick={() => {
                      const el = document.getElementById(
                        `faq-${cat.title.toLowerCase().replace(/\s+/g, "-")}`,
                      );
                      el?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-white/[0.12] rounded-lg text-xs text-gray-500 hover:text-gray-900 transition-all"
                  >
                    <Icon className="h-3 w-3" /> {cat.title}
                  </button>
                );
              })}
            </div>
          </FadeIn>

          {filteredCategories.length === 0 && (
            <FadeIn delay={0.15}>
              <div className="mt-12 text-center py-16">
                <Search className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-base font-medium mb-2">
                  No matching questions found
                </p>
                <p className="text-gray-500 text-sm">
                  Try different keywords or browse our categories above
                </p>
              </div>
            </FadeIn>
          )}

          <StaggerList
            className="mt-10 space-y-8"
            stagger={0.05}
            delayStart={0.15}
          >
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <StaggerItem key={cat.title}>
                  <div
                    id={`faq-${cat.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className="scroll-mt-24"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-olive-500/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-olive-400" />
                      </div>
                      <h2 className="text-base font-bold text-gray-900">
                        {cat.title}
                      </h2>
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                        {cat.items.length}
                      </span>
                    </div>
                    <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl px-5 sm:px-6">
                      {cat.items.map((item, j) => {
                        const key = `${cat.title}-${j}`;
                        return (
                          <FaqAccordionItem
                            key={key}
                            item={item}
                            isOpen={!!openItems[key]}
                            onToggle={() => toggle(key)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>

          <FadeIn delay={0.4}>
            <div className="mt-14 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
              <Headphones className="h-6 w-6 text-olive-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Still Have Questions?
              </h3>
              <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                Our support team is available 24/7 to help you with anything not
                covered here.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold rounded-xl transition-colors glow-olive-sm"
                >
                  <Mail className="h-4 w-4" /> Contact Support
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-900 text-sm font-medium rounded-xl transition-colors"
                >
                  Track a Shipment <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
