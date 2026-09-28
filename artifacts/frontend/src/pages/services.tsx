import { useState } from "react";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/fade-in";
import { useLocation, Link } from "wouter";
import { useEliteAnimations } from "@/hooks/useEliteAnimations";
import { Helmet } from "react-helmet-async";
import { PublicNavbar } from "@/components/navbar";
import {
  Zap,
  Globe,
  Truck,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
  BarChart3,
  Headphones,
  RefreshCw,
  Plane,
  Ship,
  Package,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
} from "lucide-react";

const SERVICES = [
  {
    id: "express",
    icon: Zap,
    name: "Express Delivery",
    tagline: "When it can't wait",
    description:
      "Our fastest domestic service guarantees next-day delivery by 10 AM. Perfect for critical documents, urgent medical supplies, or time-sensitive business shipments.",
    delivery: "Next day by 10 AM",
    badge: "24h",
    features: [
      "Priority pickup within 2 hours",
      "Door-to-door delivery",
      "In-app and email status alerts",
      "Guaranteed delivery window",
      "Up to 30 kg per parcel",
      "Insurance up to $2,000",
    ],
  },
  {
    id: "standard",
    icon: Truck,
    name: "Standard Shipping",
    tagline: "Reliable, affordable, everyday",
    description:
      "Our most popular domestic service. Balancing cost and speed, Standard Shipping delivers in 3–5 business days with full tracking visibility.",
    delivery: "3–5 business days",
    badge: "3–5 days",
    features: [
      "Scheduled daily pickups",
      "Door-to-door delivery",
      "Online tracking portal",
      "Delivery confirmation",
      "Up to 70 kg per parcel",
      "Insurance up to $500",
    ],
  },
  {
    id: "international",
    icon: Globe,
    name: "International",
    tagline: "Borderless delivery",
    description:
      "Reach customers in 180+ countries. We handle customs documentation, import duties, and last-mile delivery so you don't have to.",
    delivery: "5–10 business days",
    badge: "Worldwide",
    features: [
      "180+ countries covered",
      "Customs clearance included",
      "Door-to-door delivery",
      "Multi-language tracking",
      "Up to 150 kg per parcel",
      "Insurance up to $5,000",
    ],
  },
  {
    id: "air",
    icon: Plane,
    name: "Air Freight",
    tagline: "Speed across borders",
    description:
      "Full charter and consolidation air cargo across 6 continents. Ideal for time-critical, high-value, or perishable shipments requiring the fastest possible transit.",
    delivery: "24–72 hours",
    badge: "Priority",
    features: [
      "Direct and consolidated options",
      "Charter flights available",
      "Dangerous goods certified",
      "Cold chain / perishables",
      "Up to 10 tonnes per booking",
      "Insurance up to $100,000",
    ],
  },
  {
    id: "sea",
    icon: Ship,
    name: "Sea Freight",
    tagline: "Volume at lowest cost",
    description:
      "FCL and LCL container shipping across 180+ port pairs. Cost-effective for large-volume shipments where transit time is flexible.",
    delivery: "10–30 business days",
    badge: "FCL / LCL",
    features: [
      "FCL and LCL options",
      "Port-to-port & door-to-door",
      "Hazardous cargo accepted",
      "Live vessel tracking",
      "No weight limit (container)",
      "Insurance up to $500,000",
    ],
  },
  {
    id: "road",
    icon: Truck,
    name: "Road Haulage",
    tagline: "Cross-border on the ground",
    description:
      "Long-haul and cross-border road freight across the Americas and Europe. Our fleet of 120+ trucks handles everything from pallets to full truckloads.",
    delivery: "2–7 business days",
    badge: "FTL / LTL",
    features: [
      "FTL and LTL options",
      "Refrigerated trailers available",
      "GPS-tracked fleet",
      "Cross-border permits handled",
      "Up to 24 tonnes per truck",
      "Insurance up to $200,000",
    ],
  },
];

const INCLUDED = [
  {
    icon: BarChart3,
    title: "Live Tracking",
    desc: "Monitor every shipment in real time with instant push notifications.",
  },
  {
    icon: Shield,
    title: "Fully Insured",
    desc: "Every consignment covered. File a claim online in minutes.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Dedicated agents via phone, email, and live chat around the clock.",
  },
  {
    icon: RefreshCw,
    title: "Managed Returns",
    desc: "Contact our operations team to coordinate reverse logistics and collection.",
  },
  {
    icon: Clock,
    title: "Flexible Pickups",
    desc: "Schedule morning, afternoon, or evening collection slots.",
  },
  {
    icon: CheckCircle2,
    title: "Proof of Delivery",
    desc: "Digital POD with a photo or delivery document on completed jobs.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Get a Quote",
    desc: "Enter your shipment details and get an instant price estimate in seconds.",
  },
  {
    n: "02",
    title: "Review & Accept",
    desc: "Our operations team reviews your request and sends a final offer to your portal.",
  },
  {
    n: "03",
    title: "We Collect",
    desc: "Our driver collects from your door at the agreed time slot.",
  },
  {
    n: "04",
    title: "Track & Receive",
    desc: "Watch your shipment move in real time and receive proof of delivery.",
  },
];

const FAQS = [
  {
    q: "How do I get a price for my shipment?",
    a: "Use our instant Rate Calculator — enter your origin, destination, weight, and preferred service to get a live estimate in seconds. No account required.",
  },
  {
    q: "Can I ship dangerous or hazardous goods?",
    a: "Yes. Our Air Freight (IATA-certified) and Sea Freight (IMDG compliant) services handle a wide range of hazardous categories. Contact our team for a dedicated DG quote.",
  },
  {
    q: "Do you handle customs clearance?",
    a: "Yes — for International, Air Freight, Sea Freight, and Road Haulage we handle all export/import documentation, HS code classification, and customs duties on your behalf.",
  },
  {
    q: "What is the difference between FCL and LCL?",
    a: "FCL (Full Container Load) means you rent the entire container — best for shipments over 15 CBM. LCL (Less than Container Load) consolidates your cargo with other shippers — ideal for smaller volumes.",
  },
  {
    q: "What happens if my shipment is delayed?",
    a: "We proactively notify you of any exception and assign a case manager. Express and Air Freight delays trigger automatic compensation under our Service Guarantee.",
  },
  {
    q: "How do I file an insurance claim?",
    a: "Log into your dashboard, navigate to the shipment in question, and click 'File Claim'. Our team reviews all claims within 48 business hours.",
  },
];

const ROUTES = [
  { from: "New York", to: "London", service: "Air Freight", time: "12 hrs" },
  { from: "Los Angeles", to: "Dubai", service: "Air Freight", time: "18 hrs" },
  { from: "Houston", to: "Rotterdam", service: "Sea Freight", time: "14 days" },
  { from: "Miami", to: "São Paulo", service: "Air Freight", time: "10 hrs" },
  { from: "Chicago", to: "Paris", service: "Express", time: "Next day" },
  { from: "Dallas", to: "Mexico City", service: "Road", time: "3 days" },
];

export default function Services() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useEliteAnimations();

  return (
    <div className="min-h-[100dvh] bg-white">
      <Helmet>
        <title>Shipping Services | Air, Road & Ocean Freight — Shiprion</title>
        <meta
          name="description"
          content="Explore Shiprion's full range of shipping services — Express Air Freight, Standard Road Freight, Ocean Freight, and same-day local delivery. Real-time tracking and 24/7 support included."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/services" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Shipping Services | Air, Road & Ocean Freight — Shiprion"
        />
        <meta
          property="og:description"
          content="Express Air, Standard Road, Ocean Freight, and same-day delivery across 180+ countries. Every shipment includes real-time tracking, insurance, and 24/7 support."
        />
        <meta property="og:url" content="https://shiprion.com/services" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta property="og:image:alt" content="Shiprion Shipping Services" />
        <meta name="twitter:title" content="Shipping Services — Shiprion" />
        <meta
          name="twitter:description"
          content="Air Freight, Road Freight, Ocean Freight & same-day delivery across 180+ countries with real-time tracking."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Shiprion Shipping Services",
            url: "https://shiprion.com/services",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Express Air Freight",
                description:
                  "1–3 business day delivery by air for time-critical shipments worldwide.",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Standard Road Freight",
                description:
                  "Cost-effective ground shipping with 3–7 business day domestic delivery.",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Ocean Freight",
                description:
                  "Bulk sea freight for heavy cargo with 15–45 day international transit.",
              },
              {
                "@type": "ListItem",
                position: 4,
                name: "Same-Day Delivery",
                description:
                  "Same-day local delivery available in 50+ metropolitan areas.",
              },
              {
                "@type": "ListItem",
                position: 5,
                name: "Freight Forwarding",
                description:
                  "End-to-end customs clearance and multi-modal freight forwarding solutions.",
              },
            ],
          })}
        </script>
      </Helmet>
      <PublicNavbar />

      <section className="relative bg-white text-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-olive-500/8 rounded-full blur-[200px] animate-orb pointer-events-none" />
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&h=600&fit=crop&fm=webp"
          alt="Logistics warehouse"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          <FadeIn direction="up">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              What We Offer
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-5">
              Every shipping solution, <br className="hidden sm:block" />
              <span className="text-gradient-olive">under one roof.</span>
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
              From overnight parcels to 40-foot containers — choose the service
              that fits your cargo, budget, and deadline.
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/calculator"
                className="flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm glow-olive"
              >
                Get Instant Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Talk to Sales
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: "180+", l: "Countries" },
            { v: "2.5M", l: "Deliveries" },
            { v: "98.7%", l: "On-Time Rate" },
            { v: "24/7", l: "Support" },
          ].map(({ v, l }) => (
            <div key={l}>
              <p className="text-2xl font-extrabold text-gray-900">{v}</p>
              <p className="text-gray-500 text-sm">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn direction="up" className="text-center mb-14">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Our Services
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Choose the right service
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Every plan includes real-time tracking, door-to-door coverage, and
              full insurance — no hidden fees.
            </p>
          </FadeIn>
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <StaggerItem key={service.id}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: "rgba(156,167,99,0.3)" }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    className="gsap-tilt-card bg-white backdrop-blur-xl rounded-2xl border border-gray-200 overflow-hidden h-full"
                  >
                    <div className="px-6 py-7 border-b border-gray-200">
                      <div className="inline-flex p-3 rounded-xl bg-olive-500/10 border border-olive-500/20 mb-4">
                        <Icon className="h-6 w-6 text-olive-400" />
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-bold text-gray-900">
                          {service.name}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-olive-500/15 text-olive-400 border border-olive-500/20">
                          {service.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        {service.tagline}
                      </p>
                    </div>
                    <div className="px-6 py-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-600">
                          {service.delivery}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed mb-5">
                        {service.description}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-start gap-2.5 text-sm text-gray-500"
                          >
                            <CheckCircle2 className="h-4 w-4 text-olive-400 shrink-0 mt-0.5" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/calculator"
                        className="w-full flex items-center justify-center gap-1.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors glow-olive-sm"
                      >
                        Get a Quote <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn direction="up" className="text-center mb-14">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              How it works
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              Book your shipment in minutes and we handle everything else.
            </p>
          </FadeIn>
          <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <StaggerItem key={step.n}>
                <div className="relative text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+2.5rem)] right-0 h-px bg-gray-200" />
                  )}
                  <div className="w-16 h-16 bg-olive-500 text-white rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-4 shadow-lg glow-olive-sm">
                    {step.n}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-24 px-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Standard Inclusions
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Everything included — no surprises
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              All services come with these features as standard.
            </p>
          </FadeIn>
          <StaggerList className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {INCLUDED.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <div className="gsap-blur-pop flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-olive-500/20 transition-all">
                  <div className="w-10 h-10 bg-olive-500/10 border border-olive-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-olive-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Trade Lanes
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Popular routes
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              We operate high-frequency lanes across the Americas, Europe, and
              the Middle East.
            </p>
          </FadeIn>
          <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROUTES.map((route) => (
              <StaggerItem key={`${route.from}-${route.to}`}>
                <motion.div
                  whileHover={{ borderColor: "rgba(156,167,99,0.3)" }}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-olive-500/10 border border-olive-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-olive-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {route.from} → {route.to}
                    </p>
                    <p className="text-xs text-gray-500">{route.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-olive-400">
                      {route.time}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-24 px-6 bg-white border-t border-gray-200 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-olive-500/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Client Stories
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              What our clients say
            </h2>
          </FadeIn>
          <StaggerList className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Shiprion's Air Freight team cleared our pharmaceutical cargo in 3 hours. Absolutely critical delivery — they delivered.",
                name: "Dr. Kwame Asante",
                role: "Supply Chain Director, MedPlus Americas",
              },
              {
                quote:
                  "We moved our entire e-commerce fulfillment to Shiprion. Order-to-door in 2 days, consistently. Game changer.",
                name: "Fatima Al-Hassan",
                role: "Founder, Silk & Thread Miami",
              },
              {
                quote:
                  "Their FCL rates to Rotterdam beat every other quote we received. The vessel tracking dashboard is excellent.",
                name: "Pierre Dubois",
                role: "Logistics Manager, CocoCo Exports",
              },
            ].map(({ quote, name, role }) => (
              <StaggerItem key={name}>
                <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-olive-500 text-olive-500"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                    "{quote}"
                  </p>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{name}</p>
                    <p className="text-gray-500 text-xs">{role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} direction="up" delay={i * 0.04}>
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white transition-colors"
                  >
                    <span className="text-sm font-bold text-gray-900 pr-4">
                      {faq.q}
                    </span>
                    {openFaq === i ? (
                      <ChevronUp className="h-4 w-4 text-olive-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-200 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white border-t border-gray-200 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-olive-500/8 rounded-full blur-[180px] pointer-events-none" />
        <FadeIn direction="up" className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Ready to ship smarter?
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Create your free account and send your first shipment today. No
            commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/calculator"
              className="flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm glow-olive"
            >
              Get Instant Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Contact Sales
            </Link>
          </div>
        </FadeIn>
      </section>

      <footer className="bg-white border-t border-gray-200 text-gray-600 py-8 px-6 text-center text-xs">
        <p>
          © {new Date().getFullYear()} Shiprion Logistics. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
