import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import ToolLayout, { ToolHero } from "@/shiprion/ToolLayout";
import {
  Zap,
  Globe,
  Truck,
  CheckCircle2,
  Shield,
  Clock,
  ArrowUpRight,
  BarChart3,
  Headphones,
  RefreshCw,
  Plane,
  Ship,
  Package,
  Plus,
  Minus,
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <ToolLayout page="services">
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
      <ToolHero
        label="Our services"
        title={
          <>
            Every shipping solution.
            <br />
            <em>Under one roof.</em>
          </>
        }
        description="From overnight parcels to 40-foot containers — choose the service that fits your cargo, budget, and deadline."
      >
        <Link href="/calculator" className="services-action">
          Get a quote <ArrowUpRight />
        </Link>
      </ToolHero>
      <section
        className="services-section tool-shell"
        aria-labelledby="services-heading"
      >
        <div className="services-section-heading" data-reveal>
          <p className="services-label">01 / Shipping solutions</p>
          <h2 id="services-heading">Choose the right service.</h2>
        </div>
        <div className="services-grid">
          {SERVICES.map(
            (
              {
                id,
                icon: Icon,
                name,
                tagline,
                description,
                delivery,
                badge,
                features,
              },
              index,
            ) => (
              <article className="services-card" key={id} data-reveal>
                <div className="services-card-top">
                  <Icon size={36} strokeWidth={1} />
                  <span>
                    0{index + 1} / {badge}
                  </span>
                </div>
                <h3>{name}</h3>
                <p className="services-tagline">{tagline}</p>
                <p>{description}</p>
                <p className="services-delivery">
                  <Clock size={18} />
                  {delivery}
                </p>
                <ul>
                  {features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/calculator" className="services-action">
                  Get a quote <ArrowUpRight />
                </Link>
              </article>
            ),
          )}
        </div>
      </section>
      <section className="services-band">
        <div className="tool-shell services-section">
          <div className="services-section-heading" data-reveal>
            <p className="services-label">02 / Every shipment</p>
            <h2>Handled with care.</h2>
          </div>
          <div className="services-benefits">
            {INCLUDED.map(({ icon: Icon, title, desc }) => (
              <div key={title} data-reveal>
                <Icon size={36} strokeWidth={1} />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="services-section tool-shell">
        <div className="services-section-heading" data-reveal>
          <p className="services-label">03 / How it works</p>
          <h2>From quote to your door.</h2>
        </div>
        <div className="services-steps">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} data-reveal>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="services-band">
        <div className="services-section tool-shell">
          <div className="services-section-heading" data-reveal>
            <p className="services-label">04 / Global connections</p>
            <h2>Popular shipping routes.</h2>
          </div>
          <div className="services-routes">
            {ROUTES.map(({ from, to, service, time }) => (
              <div key={from} data-reveal>
                <h3>
                  {from} <ArrowUpRight /> {to}
                </h3>
                <p>
                  {service}
                  <span>{time}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="services-section tool-shell">
        <div className="services-section-heading" data-reveal>
          <p className="services-label">05 / Your questions</p>
          <h2>Good to know.</h2>
        </div>
        <div className="services-faq">
          {FAQS.map(({ q, a }, i) => (
            <div key={q}>
              <h3>
                <button
                  aria-expanded={openFaq === i}
                  aria-controls={`service-answer-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {q}
                  {openFaq === i ? <Minus /> : <Plus />}
                </button>
              </h3>
              <div id={`service-answer-${i}`} hidden={openFaq !== i}>
                <p>{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="services-cta">
        <div className="tool-shell" data-reveal>
          <p className="services-label">Let's get moving</p>
          <h2>Ready to ship smarter?</h2>
          <p>
            Create your free account and send your first shipment today. No
            commitment required.
          </p>
          <div>
            <Link href="/calculator" className="services-action">
              Get instant quote <ArrowUpRight />
            </Link>
            <Link
              href="/contact"
              className="services-action services-action-light"
            >
              Contact sales <ArrowUpRight />
            </Link>
          </div>
        </div>
      </section>
    </ToolLayout>
  );
}
