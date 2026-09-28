import { useState, useEffect, useRef, useCallback } from "react";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useEliteAnimations } from "@/hooks/useEliteAnimations";
import { ScrambleText } from "@/components/ScrambleText";
import {
  siApple,
  siSamsung,
  siNike,
  siToyota,
  siIkea,
  siAdidas,
  siSony,
  siBmw,
  siSiemens,
  siBosch,
  siShell,
  siVolvo,
  siLg,
  siCaterpillar,
  siHp,
  siPanasonic,
  type SimpleIcon,
} from "simple-icons";
import { MagneticElement } from "@/components/MagneticElement";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet-async";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
} from "@vis.gl/react-google-maps";
import {
  DollarSign,
  Headphones,
  MapPin,
  ShieldCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  Plane,
  PlaneTakeoff,
  Truck,
  Ship,
  Package,
  ArrowRight,
  Phone,
  Mail,
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  FileText,
  CheckCircle,
  Globe,
  Clock,
  Zap,
  Award,
  Shield,
} from "lucide-react";

declare const __GOOGLE_MAPS_API_KEY__: string;

function scrollTo(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

type NavItem =
  | { label: string; kind: "route"; href: string }
  | { label: string; kind: "scroll"; section: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", kind: "scroll", section: "hero" },
  { label: "About Us", kind: "route", href: "/about" },
  { label: "Services", kind: "route", href: "/services" },
  { label: "News", kind: "route", href: "/news" },
  { label: "Track Order", kind: "route", href: "/track" },
];

function Navbar() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  const ctaHref = user ? "/dashboard" : "/login?tab=register";
  const CtaIcon = user ? LayoutDashboard : LogIn;
  const ctaLabel = user ? "My Dashboard" : "Get Started";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNav(item: NavItem, close = false) {
    if (close) setMenuOpen(false);
    if (item.kind === "route") {
      setLocation(item.href);
    } else {
      scrollTo(item.section);
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/90 backdrop-blur-2xl border-b border-gray-200 shadow-md" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="relative flex items-center justify-center rounded-xl shrink-0 glow-olive-sm"
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #9CA763 0%, #7a8750 100%)",
            }}
          >
            <Truck
              style={{
                position: "absolute",
                bottom: 5,
                left: 4,
                width: 18,
                height: 18,
                color: "#fff",
              }}
            />
            <PlaneTakeoff
              style={{
                position: "absolute",
                top: 4,
                right: 3,
                width: 11,
                height: 11,
                color: "rgba(255,255,255,0.85)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background:
                  "linear-gradient(135deg, transparent 52%, rgba(255,255,255,0.08) 52%)",
              }}
            />
          </div>
          <span
            className={`text-xl font-extrabold ${scrolled ? "text-gray-900" : "text-white"}`}
          >
            ShipRion<span className="text-olive-400">.</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) =>
            item.kind === "route" ? (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${scrolled ? "text-gray-600 hover:text-olive-600" : "text-white/80 hover:text-white"}`}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={`text-sm font-medium transition-colors duration-200 ${scrolled ? "text-gray-600 hover:text-olive-600" : "text-white/80 hover:text-white"}`}
              >
                {item.label}
              </button>
            ),
          )}
          {user && (
            <Link
              href="/calculator"
              className="text-sm font-semibold text-olive-400 hover:text-olive-300 transition-colors"
            >
              Request Quote
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {!user && (
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"}`}
            >
              Sign In
            </Link>
          )}
          <Link
            href={ctaHref}
            className="flex items-center gap-2 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 glow-olive-sm hover:glow-olive"
          >
            <CtaIcon className="h-4 w-4" />
            {ctaLabel}
          </Link>
        </div>

        <button
          className={`md:hidden p-2 ${scrolled ? "text-gray-900" : "text-white"}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-50/95 backdrop-blur-2xl border-t border-gray-200 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) =>
            item.kind === "route" ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block w-full py-2.5 px-2 text-sm font-medium text-gray-600 hover:text-olive-400 hover:bg-white/80 rounded transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => handleNav(item, true)}
                className="block w-full text-left py-2.5 px-2 text-sm font-medium text-gray-600 hover:text-olive-400 hover:bg-white/80 rounded transition-colors"
              >
                {item.label}
              </button>
            ),
          )}
          {user && (
            <Link
              href="/calculator"
              onClick={() => setMenuOpen(false)}
              className="block w-full py-2.5 px-2 text-sm font-semibold text-olive-400 hover:text-olive-300 hover:bg-white/80 rounded transition-colors"
            >
              Request Quote
            </Link>
          )}
          <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
            {!user && (
              <Link
                href="/login"
                className="block text-center py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
            <Link
              href={ctaHref}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all glow-olive-sm"
            >
              <CtaIcon className="h-4 w-4" />
              {ctaLabel}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  const [, setLocation] = useLocation();

  return (
    <section id="hero" className="select-none overflow-hidden">
      {/* ── Image block (full-screen on desktop, fixed height on mobile) ── */}
      <div className="relative h-[82vw] sm:h-screen sm:min-h-screen">
        <img
          src="/images/hero-truck.webp"
          alt="Shiprion freight truck on open highway at twilight"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-r from-black/75 via-black/35 to-black/5"
          aria-hidden="true"
        />

        <div className="gsap-orb-1 blur-decoration absolute top-20 right-[15%] w-[500px] h-[500px] bg-olive-500/8 rounded-full blur-[140px] animate-orb pointer-events-none z-[2]" />
        <div className="gsap-orb-2 blur-decoration absolute bottom-0 left-[5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] animate-orb-alt pointer-events-none z-[2]" />

        {/* Desktop-only: full text overlay */}
        <div className="hidden sm:flex relative z-10 h-full items-center w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-24 pt-32">
            <div className="max-w-2xl gsap-hero-content">
              <div className="flex items-center gap-3 mb-5 gsap-hero-badge">
                <div className="h-px w-8 bg-olive-500" />
                <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase">
                  Shiprion Logistics
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 gsap-hero-title drop-shadow-lg">
                Powering Global Commerce,
                <br />
                Delivered <span className="text-gradient-olive">Worldwide</span>
              </h1>
              <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-10 max-w-lg gsap-hero-sub drop-shadow">
                Enterprise logistics infrastructure connecting 180+ countries
                with AI-optimized routing, real-time visibility, and end-to-end
                supply chain intelligence.
              </p>
              <div className="flex flex-wrap gap-4 gsap-hero-cta">
                <MagneticElement>
                  <Link
                    href="/calculator"
                    className="bg-olive-500 hover:bg-olive-400 active:bg-olive-600 text-white font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 flex items-center gap-2 glow-olive hover:shadow-[0_0_30px_rgba(156,167,99,0.4)]"
                  >
                    Get Your Quote <ArrowRight className="h-4 w-4" />
                  </Link>
                </MagneticElement>
                <MagneticElement>
                  <Link
                    href="/track"
                    className="border border-white/50 hover:border-white hover:bg-white/15 text-white font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  >
                    Track Shipment
                  </Link>
                </MagneticElement>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only: buttons overlaid at bottom of image */}
        <div className="sm:hidden absolute bottom-4 left-4 right-4 z-10 flex gap-3">
          <Link
            href="/calculator"
            className="flex-1 bg-olive-500 hover:bg-olive-400 active:bg-olive-600 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 glow-olive"
          >
            Get Quote <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/track"
            className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            Track Shipment
          </Link>
        </div>

        {/* Desktop side widgets */}
        <div className="hidden lg:flex absolute top-28 right-8 z-20 flex-col gap-3">
          <div className="gsap-hero-widgets bg-white/80 backdrop-blur-2xl border border-gray-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
                Live
              </span>
            </div>
            <p className="text-gray-900 text-xl font-bold tracking-tight">
              12,847
            </p>
            <p className="text-gray-500 text-xs">Active Shipments Now</p>
          </div>
          <div className="gsap-hero-widgets bg-white/80 backdrop-blur-2xl border border-gray-200 rounded-xl px-5 py-4">
            <p className="text-olive-400 text-xl font-bold tracking-tight">
              99.4%
            </p>
            <p className="text-gray-500 text-xs">On-Time Delivery Rate</p>
          </div>
        </div>

        {/* Desktop bottom badge */}
        <div className="absolute bottom-8 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-end gap-4">
          <div className="gsap-hero-badge-bottom hidden sm:flex items-center gap-3 bg-white/80 backdrop-blur-2xl border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex -space-x-2">
              {["#3b82f6", "#ef4444", "#22c55e"].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-yellow-400 text-xs mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
                <span className="text-gray-900 font-bold ml-1">4.8</span>
              </div>
              <p className="text-gray-500 text-xs leading-tight max-w-[180px]">
                Trusted by 50K+ businesses for reliable freight worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile-only: text content below the image ── */}
      <div className="sm:hidden bg-white px-5 pt-7 pb-10">
        <div className="flex items-center gap-3 mb-4 gsap-hero-badge">
          <div className="h-px w-8 bg-olive-500" />
          <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase">
            Shiprion Logistics
          </p>
        </div>
        <h1 className="text-[2.25rem] font-extrabold leading-[1.1] mb-4 gsap-hero-title">
          Powering Global Commerce,
          <br />
          Delivered <span className="text-gradient-olive">Worldwide</span>
        </h1>
        <p className="text-gray-500 text-base leading-relaxed gsap-hero-sub">
          Enterprise logistics infrastructure connecting 180+ countries with
          AI-optimized routing, real-time visibility, and end-to-end supply
          chain intelligence.
        </p>
      </div>
    </section>
  );
}

function FeaturesStrip() {
  const features = [
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      desc: "Algorithmically optimized rates with zero hidden fees across every service tier and trade lane.",
    },
    {
      icon: Headphones,
      title: "24/7 Operations Center",
      desc: "Round-the-clock logistics coordination with dedicated account managers and priority escalation.",
    },
    {
      icon: MapPin,
      title: "Live Fleet Tracking",
      desc: "GPS and IoT-powered updates on every shipment — from first mile to final delivery.",
    },
    {
      icon: ShieldCheck,
      title: "Cargo Protection",
      desc: "Comprehensive insurance and tamper-evident handling protocols for every consignment.",
    },
  ];

  return (
    <section
      id="features"
      className="relative bg-white border-b border-gray-100"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="flex items-start gap-4 gsap-blur-pop"
            data-delay={`${i * 0.08}`}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-olive-500/10 border border-olive-500/20 flex items-center justify-center transition-transform duration-200 hover:scale-110 hover:rotate-6">
              <Icon className="h-5 w-5 text-olive-400" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  const [, setLocation] = useLocation();

  return (
    <section id="about" className="py-28 bg-gray-50 relative overflow-hidden">
      <div className="blur-decoration absolute top-0 right-0 w-[500px] h-[500px] bg-olive-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="gsap-about-text">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-6 tracking-widest uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
              Who We Are
            </span>
            <div className="gsap-clip-wipe mb-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                The Operating System
                <br />
                for <span className="text-gradient-olive">Global Trade</span>
              </h2>
            </div>
            <p className="text-gray-500 leading-relaxed mb-4">
              More than a logistics provider — we're a technology company
              building the infrastructure for modern commerce. Our proprietary
              routing engine processes millions of data points in real-time,
              optimizing every shipment across 180+ countries for speed, cost,
              and carbon efficiency.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              Backed by a decade of supply chain expertise and cutting-edge
              infrastructure, Shiprion integrates seamlessly into your
              operations through REST APIs, EDI, and native ERP connectors — so
              you can scale without complexity.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-olive-500 hover:bg-olive-400 active:scale-95 text-white font-semibold px-6 py-3 rounded-lg transition-all glow-olive-sm"
            >
              Explore Our Platform <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative h-[420px] gsap-about-images">
            <div className="absolute inset-0 bg-gradient-to-br from-olive-500/10 via-transparent to-blue-500/5 rounded-3xl" />
            <img
              src="/images/about-truck.webp"
              alt="Freight truck"
              loading="lazy"
              decoding="async"
              className="absolute top-0 right-0 w-64 h-48 object-cover rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-gray-200"
            />
            <img
              src="/images/about-port.webp"
              alt="Container port"
              loading="lazy"
              decoding="async"
              className="absolute bottom-0 left-0 w-56 h-48 object-cover rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-gray-200"
            />
            <img
              src="/images/about-worker.webp"
              alt="Logistics operations manager"
              loading="lazy"
              decoding="async"
              className="absolute top-24 left-28 w-48 h-40 object-cover rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border-2 border-olive-500/30"
            />
            <div
              className="absolute -bottom-4 right-12 w-24 h-24 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #9CA763 1.5px, transparent 1.5px)",
                backgroundSize: "12px 12px",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const [, setLocation] = useLocation();
  const services = [
    {
      icon: Plane,
      title: "Air Freight",
      img: "/images/service-air-freight.webp",
      desc: "Priority cargo with guaranteed space at 120+ airports. Same-day booking, customs pre-clearance, and door-to-door visibility.",
    },
    {
      icon: Truck,
      title: "Road Freight",
      img: "/images/service-road-freight.webp",
      desc: "FTL and LTL with GPS-tracked fleet. Flexible scheduling, temperature control, and digital proof of delivery.",
    },
    {
      icon: Ship,
      title: "Ocean Freight",
      img: "/images/service-ocean-freight.webp",
      desc: "FCL and LCL with port-to-door logistics. Real-time container tracking, demurrage management, and automated docs.",
    },
  ];

  return (
    <section id="services" className="py-28 bg-white relative">
      <div className="blur-decoration absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-olive-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-16 gsap-services-heading">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            How We Deliver{" "}
            <span className="text-gradient-olive">Excellence</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map(({ icon: Icon, title, img, desc }, i) => (
            <div key={title} className="gsap-tilt-card">
              <Link href="/services" className="block">
                <div className="group relative rounded-2xl overflow-hidden h-80 border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 rounded-2xl border border-olive-500/0 group-hover:border-olive-500/30 transition-all duration-500 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                    <div className="w-10 h-10 rounded-xl bg-olive-500/90 flex items-center justify-center mb-1 glow-olive-sm transition-transform duration-200 group-hover:scale-110">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight">
                      {title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {desc}
                    </p>
                    <span className="text-sm font-semibold text-olive-300 flex items-center gap-1 group-hover:gap-2.5 transition-all duration-300 mt-1">
                      Learn More <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "Get an Estimate",
    desc: "Choose an active service and enter the actual weight to receive a server-calculated USD estimate with an itemized rate breakdown.",
  },
  {
    step: "02",
    icon: Package,
    title: "Request & Review",
    desc: "Submit cargo and contact details. Our operations team reviews the request and publishes a time-limited final offer.",
  },
  {
    step: "03",
    icon: Globe,
    title: "Accept & Dispatch",
    desc: "Accept the offer from your verified account. Operations converts it once into a customer-owned shipment and begins tracking.",
  },
  {
    step: "04",
    icon: CheckCircle,
    title: "Delivered & Verified",
    desc: "Authorized staff records private proof of delivery while shipment and support notifications remain available in your dashboard.",
  },
];

const DELIVERY_TEAM = [
  {
    name: "Marcus Reid",
    role: "Senior Field Agent",
    region: "North America",
    deliveries: "12,400+",
    rating: 4.98,
    badge: "Elite",
    img: "/images/delivery-guy-1.webp",
    accent: "#6b7c3b",
  },
  {
    name: "Priya Anand",
    role: "Express Courier",
    region: "Asia Pacific",
    deliveries: "9,800+",
    rating: 4.96,
    badge: "Top Rated",
    img: "/images/delivery-guy-2.webp",
    accent: "#4a7c6b",
  },
  {
    name: "David & Tom",
    role: "Freight Specialists",
    region: "Europe",
    deliveries: "18,200+",
    rating: 4.99,
    badge: "Verified",
    img: "/images/delivery-guy-3.webp",
    accent: "#3b5c8c",
  },
];

const DELIVERY_STATS = [
  {
    icon: Package,
    target: 2.4,
    decimals: 1,
    suffix: "M+",
    label: "Packages Delivered",
  },
  {
    icon: Clock,
    target: 99.4,
    decimals: 1,
    suffix: "%",
    label: "On-Time Rate",
  },
  {
    icon: Star,
    target: 4.97,
    decimals: 2,
    suffix: "",
    label: "Avg. Agent Rating",
  },
  {
    icon: Shield,
    target: 100,
    decimals: 0,
    suffix: "%",
    label: "Insured Deliveries",
  },
];

function DeliveryTeamSection() {
  const [, setLocation] = useLocation();

  return (
    <section id="delivery-team" className="bg-white overflow-hidden">
      {/* ── Warehouse banner ── */}
      <div className="relative overflow-hidden">
        <img
          src="/images/delivery-warehouse.webp"
          alt="Shiprion warehouse operations"
          loading="lazy"
          decoding="async"
          className="w-full h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a]/80 via-[#0a0f1a]/50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 sm:px-20">
          <div>
            <div className="inline-flex items-center gap-2 bg-olive-500/20 border border-olive-500/40 rounded-full px-3 py-1 mb-3">
              <Truck className="w-3 h-3 text-olive-400" />
              <span className="text-xs font-bold text-olive-400 tracking-widest uppercase">
                Shiprion Operations
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight max-w-xl">
              Delivered by People
              <br />
              <span className="text-olive-400">Who Care.</span>
            </h2>
            <p className="text-gray-300 text-sm mt-2 max-w-sm">
              Every package is handled by certified Shiprion agents trained for
              speed, safety, and care.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="bg-[#0a0f1a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
          {DELIVERY_STATS.map(
            ({ icon: Icon, target, decimals, suffix, label }) => (
              <div
                key={label}
                className="flex flex-col items-center py-6 gap-1"
              >
                <Icon className="w-4 h-4 text-olive-400 mb-1" />
                <span className="text-2xl font-extrabold text-white">
                  <span
                    className="gsap-scrub-counter"
                    data-target={String(target)}
                    data-decimals={String(decimals)}
                    data-suffix={suffix}
                  >
                    {(0).toFixed(decimals)}
                    {suffix}
                  </span>
                </span>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-6 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
          <Award className="w-3 h-3" />
          Certified Delivery Pros
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
          The Team Behind{" "}
          <span className="text-gradient-olive">Every Delivery</span>
        </h2>
        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
          Our agents are trained, vetted, and equipped with real-time tracking
          tools to ensure your cargo arrives exactly as promised.
        </p>
      </div>

      {/* ── Team cards ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="gsap-cascade grid grid-cols-1 md:grid-cols-3 gap-6">
          {DELIVERY_TEAM.map((member) => (
            <div
              key={member.name}
              className="gsap-cascade-item group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_56px_rgba(0,0,0,0.12)]"
            >
              {/* Photo */}
              <div className="relative overflow-hidden h-64">
                <img
                  src={member.img}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badge */}
                <div
                  className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: `${member.accent}22`,
                    border: `1px solid ${member.accent}55`,
                  }}
                >
                  <CheckCircle
                    className="w-3 h-3"
                    style={{ color: member.accent }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: member.accent }}
                  >
                    {member.badge}
                  </span>
                </div>

                {/* Region */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-white/80" />
                  <span className="text-xs text-white/80">{member.region}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-base font-bold text-gray-900 mb-0.5">
                  {member.name}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{member.role}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Deliveries
                    </p>
                    <p className="text-lg font-extrabold text-gray-900">
                      {member.deliveries}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Rating
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-extrabold text-gray-900">
                        {member.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: member.accent }}
              />
            </div>
          ))}
        </div>

        {/* ── Promise CTA strip ── */}
        <div className="mt-10 rounded-2xl bg-[#0a0f1a] relative overflow-hidden px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #9CA763 0%, transparent 50%), radial-gradient(circle at 80% 50%, #4a7c9a 0%, transparent 50%)",
            }}
          />
          {/* Decorative box icons */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-2 opacity-20 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-10 h-12 border-2 border-white/60 rounded-md"
                style={{
                  transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -4 : 4}px)`,
                }}
              />
            ))}
          </div>
          <div className="relative">
            <h3 className="text-xl font-extrabold text-white mb-1">
              Your Package. Our Promise.
            </h3>
            <p className="text-gray-400 text-sm max-w-sm">
              Real-time updates, damage protection, and a 100% satisfaction
              guarantee on every shipment.
            </p>
          </div>
          <Link
            href="/track"
            className="relative shrink-0 flex items-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors glow-olive-sm"
          >
            Track Your Package <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-28 bg-gray-50 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="blur-decoration absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-olive-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-16 gsap-hiw-heading">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Ship in <span className="text-gradient-olive">4 Simple Steps</span>
          </h2>
          <p className="text-gray-500 mt-4 text-sm sm:text-base max-w-lg mx-auto">
            From quote to doorstep — Shiprion removes every friction point so
            you can focus on growing your business.
          </p>
        </div>

        <div className="gsap-cascade grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
          <div className="gsap-hiw-connector-bg hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-olive-500/30 to-transparent pointer-events-none" />
          <svg
            className="hidden lg:block absolute pointer-events-none overflow-visible"
            style={{ top: "39px", left: "12.5%", width: "75%", height: "2px" }}
            viewBox="0 0 800 2"
            preserveAspectRatio="none"
          >
            <path
              d="M0,1 L800,1"
              className="gsap-draw-path"
              stroke="rgba(156,167,99,0.7)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {HOW_STEPS.map(({ step, icon: Icon, title, desc }, i) => (
            <div
              key={step}
              className="gsap-cascade-item flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl border border-olive-500/20 bg-olive-500/5 flex items-center justify-center backdrop-blur-sm">
                  <Icon className="h-8 w-8 text-olive-400" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-olive-500 text-white text-xs font-extrabold flex items-center justify-center shadow-lg glow-olive-sm">
                  {step}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 gsap-hiw-footer">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock className="w-4 h-4 text-olive-400" />
            Average quote request takes under 3 minutes
          </div>
          <span className="hidden sm:block text-gray-700">|</span>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <ShieldCheck className="w-4 h-4 text-olive-400" />
            All shipments fully insured end-to-end
          </div>
          <span className="hidden sm:block text-gray-700">|</span>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Headphones className="w-4 h-4 text-olive-400" />
            24/7 dedicated support included
          </div>
        </div>
      </div>
    </section>
  );
}

function RateEstimatorSection() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"Package" | "Document">("Package");
  const [form, setForm] = useState({
    pickup: "",
    delivery: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    quantity: "1",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = new URLSearchParams({
      origin: form.pickup,
      destination: form.delivery,
      weight: form.weight,
    });
    setLocation(`/calculator?${query.toString()}`);
  }

  return (
    <section
      id="rate-estimator"
      className="py-28 bg-white relative overflow-hidden"
    >
      <div className="blur-decoration absolute top-0 left-0 w-[400px] h-[400px] bg-olive-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-4 gsap-rate-heading">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
            Live Rate Engine
          </span>
        </div>
        <div className="text-center mb-14 gsap-rate-heading">
          <div className="gsap-split-heading">
            <div className="gsap-split-top overflow-hidden">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
                Shipping Rate
              </h2>
            </div>
            <div className="gsap-split-bottom overflow-hidden">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
                <span className="text-gradient-olive">Estimator</span>
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-8 gsap-rate-form">
            <div className="flex gap-1 border-b border-gray-200 mb-6">
              {(["Package", "Document"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === t ? "border-olive-500 text-olive-400" : "border-transparent text-gray-500 hover:text-gray-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Pickup Location
                  </label>
                  <input
                    className="w-full bg-white/80 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-olive-500/50 focus:ring-1 focus:ring-olive-500/20 transition-all"
                    placeholder="Enter city or zip"
                    value={form.pickup}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pickup: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Delivery Location
                  </label>
                  <input
                    className="w-full bg-white/80 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-olive-500/50 focus:ring-1 focus:ring-olive-500/20 transition-all"
                    placeholder="Enter city or zip"
                    value={form.delivery}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, delivery: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Weight (kg)
                  </label>
                  <input
                    className="w-full bg-white/80 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-olive-500/50 focus:ring-1 focus:ring-olive-500/20 transition-all"
                    placeholder="0.0"
                    type="number"
                    min="0"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weight: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Quantity
                  </label>
                  <input
                    className="w-full bg-white/80 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-olive-500/50 focus:ring-1 focus:ring-olive-500/20 transition-all"
                    placeholder="1"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </div>
              </div>

              {tab === "Package" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Dimensions (cm) — L × W × H
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["length", "width", "height"] as const).map((field) => (
                      <input
                        key={field}
                        className="bg-white/80 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-olive-500/50 focus:ring-1 focus:ring-olive-500/20 transition-all"
                        placeholder={
                          field.charAt(0).toUpperCase() + field.slice(1)
                        }
                        type="number"
                        min="0"
                        value={form[field]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [field]: e.target.value }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-olive-500 hover:bg-olive-400 text-white font-semibold py-3.5 rounded-lg transition-all mt-2 glow-olive-sm hover:glow-olive"
              >
                Get Instant Estimate
              </button>
            </form>
          </div>

          <div className="relative hidden lg:block h-[420px] rounded-2xl overflow-hidden gsap-rate-image border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=700&q=80&fm=webp"
              alt="Shipping containers at port"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-xl p-5">
                <p className="text-gray-900 font-bold text-lg mb-1">
                  Current service-rate estimates
                </p>
                <p className="text-gray-600 text-sm">
                  Choose an active service to see its base, weight, and fuel
                  components before requesting review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    name: "Sarah Matthews",
    role: "VP Operations, Apex Retail Group",
    text: "Shiprion transformed our supply chain. Deliveries that used to take weeks now arrive in days. Their platform is intuitive and their operations team is always there when we need them.",
    rating: 5,
    avatar: "SM",
    color: "#3b82f6",
  },
  {
    name: "James Chen",
    role: "CEO, Pacific Trade Co.",
    text: "As an e-commerce business expanding into 12 new markets, we needed a partner who could scale with us. Shiprion's international network and real-time tracking gave us that confidence.",
    rating: 5,
    avatar: "JC",
    color: "#ef4444",
  },
  {
    name: "Dr. Michael Field",
    role: "Logistics Director, MedSupply International",
    text: "The cargo safety assurance is exceptional. We ship sensitive medical equipment worth millions and Shiprion handles every consignment with the utmost precision. Highly recommended.",
    rating: 5,
    avatar: "MF",
    color: "#22c55e",
  },
  {
    name: "Elena Rodriguez",
    role: "SVP Import/Export, Continental Foods",
    text: "We move perishable goods across three continents. Shiprion's cold-chain management and proactive customs support have been a complete game-changer for our business.",
    rating: 5,
    avatar: "ER",
    color: "#f59e0b",
  },
  {
    name: "David Park",
    role: "Head of Warehouse Ops, TechParts Global",
    text: "The real-time dashboard gives our team full visibility from pickup to final delivery. We've cut carrier disputes by 80% since switching to Shiprion.",
    rating: 5,
    avatar: "DP",
    color: "#8b5cf6",
  },
  {
    name: "Amanda Foster",
    role: "Director of Procurement, BuildRight Construction",
    text: "Oversized freight used to be a nightmare. Shiprion's specialist heavy-lift team handles our project cargo flawlessly and always delivers on schedule.",
    rating: 4,
    avatar: "AF",
    color: "#06b6d4",
  },
  {
    name: "Robert Kim",
    role: "VP Supply Chain, FashionFirst",
    text: "Speed to market is everything in fashion. Shiprion's express air freight keeps our seasonal collections moving and our 200+ retail partners happy.",
    rating: 5,
    avatar: "RK",
    color: "#ec4899",
  },
  {
    name: "Lisa Thompson",
    role: "Founder, Thompson Handcrafts",
    text: "As a small business shipping handmade goods globally, I need a freight partner I can trust. Shiprion treats every parcel like it matters — because to me, it does.",
    rating: 5,
    avatar: "LT",
    color: "#10b981",
  },
  {
    name: "Carlos Reyes",
    role: "COO, HealthPlus Pharmaceuticals",
    text: "Regulatory compliance is non-negotiable in pharma logistics. Shiprion's documentation team ensures every temperature-sensitive shipment is fully compliant and traceable end-to-end.",
    rating: 5,
    avatar: "CR",
    color: "#f97316",
  },
  {
    name: "Jennifer Watts",
    role: "E-commerce Director, HomeLiving Co.",
    text: "Returns logistics used to drain our resources. Shiprion built a custom reverse-logistics flow that reduced our return processing time by half.",
    rating: 5,
    avatar: "JW",
    color: "#6366f1",
  },
  {
    name: "Mark Sullivan",
    role: "IT Director, AutoParts Express",
    text: "Shiprion's portal gave our team a clear quote workflow, shipment tracking, and one place to follow operational updates as we scaled.",
    rating: 4,
    avatar: "MS",
    color: "#14b8a6",
  },
  {
    name: "Priya Patel",
    role: "International Trade Specialist, GlobalTex",
    text: "Navigating import duties across 20 countries used to require three brokers. Shiprion's in-house customs intelligence engine handles it all seamlessly. Outstanding.",
    rating: 5,
    avatar: "PP",
    color: "#a855f7",
  },
  {
    name: "Tom Bradley",
    role: "Director of Operations, ColdChain Logistics",
    text: "Temperature-controlled freight demands precision. Shiprion monitors our reefer containers throughout transit and alerts us instantly if conditions shift.",
    rating: 5,
    avatar: "TB",
    color: "#0ea5e9",
  },
];

function TestimonialCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <div
      className="
        flex-shrink-0 w-[300px] sm:w-[340px]
        bg-white backdrop-blur-xl rounded-2xl p-6
        border border-gray-200
        hover:border-olive-500/20
        shadow-[0_2px_16px_rgba(0,0,0,0.08)]
        hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        transition-all duration-300 hover:-translate-y-1.5
        cursor-default
      "
    >
      <Quote className="h-6 w-6 mb-3 opacity-60" style={{ color: t.color }} />
      <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-4">
        {t.text}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: t.color }}
        >
          {t.avatar}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{t.name}</p>
          <p className="text-gray-500 text-xs truncate">{t.role}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mt-3">
        {[...Array(5)].map((_, j) => (
          <Star
            key={j}
            className={`h-3.5 w-3.5 fill-current ${j < t.rating ? "text-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const [paused, setPaused] = useState(false);

  return (
    <section
      id="testimonials"
      className="py-28 bg-gray-50 overflow-hidden relative"
    >
      <div className="blur-decoration absolute top-0 right-0 w-[500px] h-[300px] bg-olive-500/5 rounded-full blur-[140px] pointer-events-none" />
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-14 gsap-testimonials-heading relative">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
          <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
          Client Stories
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
          Trusted by{" "}
          <span className="text-gradient-olive">Industry Leaders</span>
        </h2>
        <p className="text-gray-500 mt-4 text-sm sm:text-base max-w-xl mx-auto">
          From startups to Fortune 500 — businesses across every continent trust
          Shiprion to move what matters.
        </p>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-40 z-10 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-40 z-10 bg-gradient-to-l from-gray-50 to-transparent" />

        <div
          className="flex gap-5 w-max py-4"
          style={{
            animation: "marquee-scroll 55s linear infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { end: 50, decimals: 0, suffix: "K+", label: "Businesses Served" },
    { end: 2, decimals: 0, suffix: "M+", label: "Packages Delivered" },
    { end: 99.4, decimals: 1, suffix: "%", label: "On-Time Delivery" },
    { end: 180, decimals: 0, suffix: "+", label: "Countries Reached" },
  ];

  return (
    <section id="stats-bar" className="relative py-16 z-[1] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#808080" }}
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(({ end, decimals, suffix, label }, i) => (
          <div key={label} className="gsap-stat">
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1">
              <span
                className="gsap-scrub-counter"
                data-target={String(end)}
                data-decimals={String(decimals)}
                data-suffix={suffix}
              >
                {(0).toFixed(decimals)}
                {suffix}
              </span>
            </p>
            <p className="text-gray-600 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const TRUSTED_LOGOS: { icon: SimpleIcon; name: string }[] = [
  { icon: siApple, name: "Apple" },
  { icon: siSamsung, name: "Samsung" },
  { icon: siNike, name: "Nike" },
  { icon: siToyota, name: "Toyota" },
  { icon: siIkea, name: "IKEA" },
  { icon: siAdidas, name: "Adidas" },
  { icon: siSony, name: "Sony" },
  { icon: siBmw, name: "BMW" },
  { icon: siSiemens, name: "Siemens" },
  { icon: siBosch, name: "Bosch" },
  { icon: siShell, name: "Shell" },
  { icon: siVolvo, name: "Volvo" },
  { icon: siLg, name: "LG" },
  { icon: siCaterpillar, name: "Caterpillar" },
  { icon: siHp, name: "HP" },
  { icon: siPanasonic, name: "Panasonic" },
];

function TrustedBySection() {
  return (
    <section
      id="trusted-by"
      className="py-14 bg-white border-t border-gray-100 overflow-hidden relative z-[1]"
    >
      <div className="text-center mb-8 gsap-trusted-heading">
        <p className="text-xs font-bold text-gray-600 tracking-widest uppercase">
          Trusted by leading businesses across 6 continents
        </p>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white to-transparent" />
        <div
          className="flex items-center gap-14 w-max"
          style={{ animation: "logo-scroll 45s linear infinite" }}
        >
          {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, i) => (
            <svg
              key={i}
              role="img"
              viewBox="0 0 24 24"
              className="h-14 w-auto shrink-0 cursor-default"
              fill={`#${logo.icon.hex}`}
              aria-label={logo.name}
              style={{
                filter: "grayscale(100%) opacity(0.35)",
                transition: "filter 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "grayscale(0%) opacity(0.9)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "grayscale(100%) opacity(0.35)")
              }
            >
              <title>{logo.name}</title>
              <path d={logo.icon.path} />
            </svg>
          ))}
        </div>
      </div>
    </section>
  );
}

const BLOG_POSTS = [
  {
    date: "12 March 2026",
    tag: "Technology",
    title: "How AI-Powered Route Optimization is Cutting Transit Times by 34%",
    img: "/images/insight-ai-routing.webp",
  },
  {
    date: "28 April 2026",
    tag: "Industry",
    title: "2026 Global Supply Chain Outlook: Navigating New Trade Corridors",
    img: "/images/insight-supply-chain.webp",
  },
  {
    date: "3 May 2026",
    tag: "Operations",
    title: "FCL vs LCL: Choosing the Right Ocean Freight Strategy for Growth",
    img: "/images/insight-container-strategy.webp",
  },
];

function BlogSection() {
  const [, setLocation] = useLocation();

  return (
    <section id="blog" className="py-28 bg-gray-50 relative z-[1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 gsap-blog-heading">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
            Insights
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Latest from <span className="text-gradient-olive">Shiprion</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {BLOG_POSTS.map(({ date, tag, title, img }, i) => (
            <div key={title} className="gsap-tilt-card">
              <div className="group relative rounded-2xl overflow-hidden cursor-pointer h-72 border border-gray-200 hover:border-olive-500/30 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
                <img
                  src={img}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-olive-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {tag}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                  <p className="text-xs text-white/70">{date}</p>
                  <h4 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-olive-200 transition-colors">
                    {title}
                  </h4>
                  <span className="text-xs font-semibold text-olive-300 flex items-center gap-1 group-hover:gap-2 transition-all mt-0.5">
                    Read Article <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gsap-blog-cta">
          <Link
            href="/news"
            className="bg-white/80 hover:bg-gray-100 border border-gray-200 hover:border-olive-500/30 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
          >
            Browse All Articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const CONTAINER_IMAGES = [
  {
    img: "/images/containers/SHR-001.webp",
    label: "SHIPRION",
    code: "SHR-001",
    route: "New York → Rotterdam",
    flag: "🇺🇸→🇳🇱",
  },
  {
    img: "/images/containers/MAE-441A.webp",
    label: "MAERSK",
    code: "MAE-441A",
    route: "Shanghai → Hamburg",
    flag: "🇨🇳→🇩🇪",
  },
  {
    img: "/images/containers/COS-3346.webp",
    label: "COSCO",
    code: "COS-3346",
    route: "Guangzhou → Los Angeles",
    flag: "🇨🇳→🇺🇸",
  },
  {
    img: "/images/containers/EVG-8831X.webp",
    label: "EVERGREEN",
    code: "EVG-8831X",
    route: "Taipei → Amsterdam",
    flag: "🇹🇼→🇳🇱",
  },
  {
    img: "/images/containers/MSC-6629F.webp",
    label: "MSC",
    code: "MSC-6629F",
    route: "Genoa → Singapore",
    flag: "🇮🇹→🇸🇬",
  },
  {
    img: "/images/containers/HPG-7712B.webp",
    label: "HAPAG-LLOYD",
    code: "HPG-7712B",
    route: "Hamburg → Dubai",
    flag: "🇩🇪→🇦🇪",
  },
  {
    img: "/images/containers/CMA-77X.webp",
    label: "CMA CGM",
    code: "CMA-77X",
    route: "Marseille → Tokyo",
    flag: "🇫🇷→🇯🇵",
  },
  {
    img: "/images/containers/YMG-14.webp",
    label: "YANG MING",
    code: "YMG-14",
    route: "Kaohsiung → Long Beach",
    flag: "🇹🇼→🇺🇸",
  },
  {
    img: "/images/containers/OOC-7743C.webp",
    label: "OOCL",
    code: "OOC-7743C",
    route: "Hong Kong → Sydney",
    flag: "🇭🇰→🇦🇺",
  },
  {
    img: "/images/containers/SHR-302.webp",
    label: "SHIPRION",
    code: "SHR-302",
    route: "Chicago → London",
    flag: "🇺🇸→🇬🇧",
  },
  {
    img: "/images/containers/ZIM-58.webp",
    label: "ZIM",
    code: "ZIM-58",
    route: "Haifa → New York",
    flag: "🇮🇱→🇺🇸",
  },
  {
    img: "/images/containers/NYK-447.webp",
    label: "NYK LINE",
    code: "NYK-447",
    route: "Yokohama → Seattle",
    flag: "🇯🇵→🇺🇸",
  },
  {
    img: "/images/containers/SHR-088.webp",
    label: "SHIPRION",
    code: "SHR-088",
    route: "Miami → Barcelona",
    flag: "🇺🇸→🇪🇸",
  },
  {
    img: "/images/containers/OCN-553.webp",
    label: "OCEAN PRIME",
    code: "OCN-553",
    route: "Brisbane → Dubai",
    flag: "🇦🇺→🇦🇪",
  },
  {
    img: "/images/containers/PLT-22.webp",
    label: "PILOT AIR",
    code: "PLT-22",
    route: "Sydney → Auckland",
    flag: "🇦🇺→🇳🇿",
  },
  {
    img: "/images/containers/SLD-991.webp",
    label: "SEALAND",
    code: "SLD-991",
    route: "Boston → Amsterdam",
    flag: "🇺🇸→🇳🇱",
  },
  {
    img: "/images/containers/TRH-229.webp",
    label: "TRANSHUB",
    code: "TRH-229",
    route: "Busan → Antwerp",
    flag: "🇰🇷→🇧🇪",
  },
  {
    img: "/images/containers/CGP-7.webp",
    label: "CARGO PRIME",
    code: "CGP-7",
    route: "Osaka → Frankfurt",
    flag: "🇯🇵→🇩🇪",
  },
  {
    img: "/images/containers/FRX-09.webp",
    label: "FREIGHTX",
    code: "FRX-09",
    route: "London → Mumbai",
    flag: "🇬🇧→🇮🇳",
  },
  {
    img: "/images/containers/GLX-2847.webp",
    label: "GLOB EXPRESS",
    code: "GLX-2847",
    route: "Berlin → Toronto",
    flag: "🇩🇪→🇨🇦",
  },
];

function ContainerCard({
  img,
  label,
  code,
  route,
  flag,
}: (typeof CONTAINER_IMAGES)[0]) {
  return (
    <div
      className="relative flex-shrink-0 rounded-xl overflow-hidden group cursor-pointer"
      style={{
        width: 340,
        height: 220,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <img
        src={img}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute top-3 left-3">
        <span
          className="text-white font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-widest"
          style={{
            background: "rgba(100,120,60,0.88)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {label}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span
          className="font-mono text-white/80 text-xs font-bold px-2 py-0.5 rounded"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
          }}
        >
          {code}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {route}
            </p>
            <p className="text-white/55 text-xs mt-0.5 font-mono">
              20'GP · ISO 668 · MAX 28T
            </p>
          </div>
          <div className="text-xl leading-none">{flag}</div>
        </div>
      </div>
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          border: "1.5px solid rgba(140,160,80,0.55)",
          boxShadow: "inset 0 0 24px rgba(100,120,60,0.12)",
        }}
      />
    </div>
  );
}

function ContainersMarqueeSection() {
  const doubled = [...CONTAINER_IMAGES, ...CONTAINER_IMAGES];
  return (
    <section className="relative overflow-hidden bg-gray-50 py-14 border-t border-gray-200/60">
      <style>{`
        @keyframes marquee-containers {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .containers-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: marquee-containers 55s linear infinite;
        }
        .containers-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">
          <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
          Global Fleet
        </span>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Over 50,000 containers in service across 180+ countries — tracked in
          real time.
        </p>
      </div>

      <div className="relative">
        <div className="containers-track px-4">
          {doubled.map((c, i) => (
            <ContainerCard key={i} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
  ];
  const routeLinks = [
    { label: "Services", href: "/services" },
    { label: "Track Package", href: "/track" },
    { label: "News & Insights", href: "/news" },
  ];
  const solutionLinks = [
    { label: "Air Freight", href: "/services" },
    { label: "Road Freight", href: "/services" },
    { label: "Ocean Freight", href: "/services" },
    { label: "Rate Calculator", href: "/calculator" },
    { label: "Contact Us", href: "/contact" },
  ];
  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Insurance Policy", href: "/insurance-policy" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <footer className="text-gray-300 relative z-[1] overflow-hidden bg-[#0a0f1a] border-t border-white/[0.08]">
      <img
        src="/images/footer-map.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        style={{ opacity: 0.18, filter: "none" }}
      />

      <div className="gsap-footer-inner relative">
        {/* CTA strip */}
        <div className="border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="relative rounded-2xl bg-white/[0.06] border border-white/10 px-8 py-10 sm:px-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute inset-0 bg-gradient-to-br from-olive-500/[0.10] via-transparent to-transparent rounded-2xl pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-olive-500/[0.12] rounded-full blur-[100px] pointer-events-none" />
              <div className="relative text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-olive-500/15 border border-olive-500/30 rounded-full px-3 py-1 mb-3">
                  <Zap className="h-3 w-3 text-olive-400" />
                  <span className="text-xs font-bold text-olive-400 tracking-widest uppercase">
                    Ready to ship?
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Move cargo smarter, faster.
                </h3>
                <p className="text-gray-400 text-sm mt-1.5 max-w-sm">
                  Join 40,000+ businesses shipping with Shiprion across 180+
                  countries.
                </p>
              </div>
              <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/calculator"
                  className="h-11 px-6 bg-olive-500 hover:bg-olive-400 text-white font-semibold rounded-lg transition-all glow-olive-sm flex items-center gap-2"
                >
                  Get a Quote <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="h-11 px-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold rounded-lg transition-all flex items-center justify-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-5">
                <div
                  className="relative flex items-center justify-center rounded-2xl shrink-0 glow-olive-sm"
                  style={{
                    width: 52,
                    height: 52,
                    background:
                      "linear-gradient(135deg, #9CA763 0%, #7a8750 100%)",
                  }}
                >
                  <Truck
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 6,
                      width: 24,
                      height: 24,
                      color: "#fff",
                    }}
                  />
                  <PlaneTakeoff
                    style={{
                      position: "absolute",
                      top: 7,
                      right: 5,
                      width: 15,
                      height: 15,
                      color: "rgba(255,255,255,0.88)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      background:
                        "linear-gradient(135deg, transparent 52%, rgba(255,255,255,0.07) 52%)",
                    }}
                  />
                </div>
                <div>
                  <div
                    className="text-white font-extrabold leading-none tracking-tight"
                    style={{ fontSize: 26 }}
                  >
                    Shiprion<span className="text-olive-400">.</span>
                  </div>
                  <div
                    className="text-gray-500 font-medium mt-0.5"
                    style={{ fontSize: 12, letterSpacing: "0.12em" }}
                  >
                    GLOBAL LOGISTICS
                  </div>
                </div>
              </Link>
              <p className="text-sm leading-relaxed text-gray-400 mb-5 max-w-xs">
                Enterprise logistics platform for air, road, and ocean freight.
                Real-time tracking, AI-optimized routing, and 24/7 operations
                support.
              </p>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">
                  All systems operational
                </span>
              </div>
              <div className="space-y-2.5 text-sm text-gray-300">
                <a
                  href="mailto:support@shiprion.com"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-olive-400 shrink-0" />{" "}
                  support@shiprion.com
                </a>
                <a
                  href="tel:+14785001234"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-olive-400 shrink-0" /> +1
                  (478) 500-1234
                </a>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-olive-400 shrink-0" />
                  <span>24/7 operations support</span>
                </div>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.18em]">
                Platform
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {navLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="hover:text-white transition-colors flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 text-olive-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {label}
                    </Link>
                  </li>
                ))}
                {routeLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="hover:text-white transition-colors flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 text-olive-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.18em]">
                Solutions
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {solutionLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="hover:text-white transition-colors flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 text-olive-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.18em]">
                Legal
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {legalLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="hover:text-white transition-colors flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 text-olive-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Operations contact */}
          <div className="border-t border-white/[0.08] pt-10 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-white font-bold text-sm mb-1">
                  Need help planning a shipment?
                </p>
                <p className="text-xs text-gray-400">
                  Send our operations team your route and cargo details.
                </p>
              </div>
              <Link
                href="/contact"
                className="h-10 px-4 bg-olive-500 hover:bg-olive-400 text-white font-semibold rounded-lg text-sm transition-all inline-flex items-center gap-1.5"
              >
                Contact support <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <Globe className="h-3.5 w-3.5 text-olive-400" />
              <span>
                &copy; {new Date().getFullYear()} Shiprion Logistics. All rights
                reserved.
              </span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span className="hidden sm:inline">180+ countries served</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span className="hidden sm:inline">99.4% on-time delivery</span>
            </div>
            <Link
              href="/contact"
              className="text-xs text-gray-400 hover:text-olive-400 transition-colors"
            >
              Contact Shiprion
            </Link>
          </div>
        </div>
      </div>
      {/* gsap-footer-inner */}
    </footer>
  );
}

const HUBS = [
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "London", lat: 51.5074, lng: -0.1278 },
  { label: "Dubai", lat: 25.2048, lng: 55.2708 },
  { label: "Singapore", lat: 1.3521, lng: 103.8198 },
  { label: "Shanghai", lat: 31.2304, lng: 121.4737 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
  { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { label: "S\u00e3o Paulo", lat: -23.5505, lng: -46.6333 },
  { label: "Chicago", lat: 41.8781, lng: -87.6298 },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
];

const ROUTES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [0, 6],
  [6, 7],
  [1, 8],
  [3, 9],
  [4, 9],
  [2, 9],
];

function ParallaxSection() {
  return (
    <section
      id="parallax-section"
      className="relative overflow-hidden"
      style={{ minHeight: "420px" }}
    >
      <img
        src="/hero-2.webp"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-28 flex flex-col items-center text-center">
        <div className="gsap-parallax-content">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-8 bg-olive-500" />
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase">
              Ready to Ship?
            </p>
            <div className="h-px w-8 bg-olive-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Fast. Reliable.{" "}
            <span className="text-gradient-olive">Worldwide.</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of businesses trusting Shiprion to move their cargo
            across 180+ countries with real-time visibility and zero
            compromises.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/calculator"
              className="bg-olive-500 hover:bg-olive-400 active:bg-olive-600 text-white font-semibold px-8 py-3.5 rounded-lg transition-all flex items-center gap-2 glow-olive"
            >
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/track"
              className="border border-gray-300 hover:border-olive-500/50 hover:bg-white/80 text-gray-900 font-semibold px-8 py-3.5 rounded-lg transition-all backdrop-blur-sm"
            >
              Track Shipment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobalMapSection() {
  const apiKey =
    typeof __GOOGLE_MAPS_API_KEY__ !== "undefined"
      ? __GOOGLE_MAPS_API_KEY__
      : "";
  return (
    <section
      id="map-section"
      className="bg-gray-50 relative"
      style={{ height: "70vh" }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-4 text-center gsap-map-header">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-olive-400 border border-olive-500/20 bg-olive-500/10 px-3 py-1.5 rounded-full mb-3 tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-olive-400" />
            Global Network
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2 drop-shadow-lg">
            Shipping to every corner of the world
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Active hubs across 6 continents and 180+ countries — your cargo is
            always close to home.
          </p>
        </div>
      </div>

      <div className="w-full h-full relative">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              mapId="global-network-map"
              defaultCenter={{ lat: 20, lng: 10 }}
              defaultZoom={2}
              gestureHandling="cooperative"
              disableDefaultUI={false}
              style={{ width: "100%", height: "100%" }}
              colorScheme="LIGHT"
            >
              {HUBS.map((hub) => (
                <AdvancedMarker
                  key={hub.label}
                  position={{ lat: hub.lat, lng: hub.lng }}
                  title={hub.label}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-3 h-3 rounded-full bg-olive-400 border-2 border-white shadow-lg ring-4 ring-olive-400/30" />
                    <span className="text-xs font-bold text-gray-900 bg-gray-50/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {hub.label}
                    </span>
                  </div>
                </AdvancedMarker>
              ))}
              {ROUTES.map(([a, b], i) => (
                <Polyline
                  key={i}
                  path={[
                    { lat: HUBS[a].lat, lng: HUBS[a].lng },
                    { lat: HUBS[b].lat, lng: HUBS[b].lng },
                  ]}
                  strokeColor="#9CA763"
                  strokeOpacity={0.55}
                  strokeWeight={1.5}
                />
              ))}
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500 mt-32">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-olive-500" />
              <p className="text-sm">
                Map unavailable — Google Maps API key not configured.
              </p>
            </div>
          </div>
        )}

        <div className="absolute bottom-8 left-6 flex flex-wrap gap-3 z-10">
          {[
            { n: "10+", label: "Major Hubs" },
            { n: "180+", label: "Countries" },
            { n: "2.5M+", label: "Deliveries / yr" },
            { n: "6", label: "Continents" },
          ].map(({ n, label }) => (
            <div
              key={label}
              className="gsap-map-stat bg-gray-50/90 backdrop-blur-xl border border-gray-200 rounded-xl px-4 py-2.5 text-center"
            >
              <div className="text-lg font-extrabold text-olive-400">{n}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:flex absolute bottom-8 right-6 z-10 flex-col items-center gap-1 text-gray-600 text-xs tracking-widest uppercase animate-bounce">
          <span>Scroll</span>
          <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
            <path
              d="M6 1v16M1 12l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useGSAPAnimations();
  useEliteAnimations();
  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Scroll progress bar */}
      <div className="gsap-progress-bar-wrapper fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-olive-500/15 pointer-events-none">
        <div
          id="gsap-progress-bar"
          className="h-full bg-gradient-to-r from-olive-400 to-olive-300 origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <Helmet>
        <title>
          Shiprion | Global Logistics Platform — Air, Road & Ocean Freight
        </title>
        <meta
          name="description"
          content="Ship smarter with Shiprion — enterprise logistics across 180+ countries. AI-optimized routing, real-time shipment tracking, air freight, road freight, and ocean freight with 24/7 support."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Shiprion | Global Logistics Platform — Air, Road & Ocean Freight"
        />
        <meta
          property="og:description"
          content="Ship smarter with Shiprion — enterprise logistics across 180+ countries. AI-optimized routing, real-time tracking, and 24/7 operations support."
        />
        <meta property="og:url" content="https://shiprion.com/" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta
          property="og:image:alt"
          content="Shiprion — Global Logistics Platform"
        />
        <meta
          name="twitter:title"
          content="Shiprion | Global Logistics Platform"
        />
        <meta
          name="twitter:description"
          content="Enterprise logistics across 180+ countries. AI-optimized routing, real-time tracking, air, road & ocean freight."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://shiprion.com/#organization",
                name: "Shiprion",
                url: "https://shiprion.com",
                logo: {
                  "@type": "ImageObject",
                  url: "https://shiprion.com/favicon.svg",
                  width: 512,
                  height: 512,
                },
                description:
                  "Enterprise logistics platform for air, road, and ocean freight across 180+ countries.",
                foundingYear: "2020",
                areaServed: "Worldwide",
                serviceType: [
                  "Air Freight",
                  "Road Freight",
                  "Ocean Freight",
                  "Express Delivery",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  availableLanguage: "English",
                  url: "https://shiprion.com/contact",
                },
                sameAs: [
                  "https://twitter.com/shiprion",
                  "https://linkedin.com/company/shiprion",
                ],
              },
              {
                "@type": "WebSite",
                "@id": "https://shiprion.com/#website",
                url: "https://shiprion.com",
                name: "Shiprion",
                publisher: { "@id": "https://shiprion.com/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://shiprion.com/track/{tracking_number}",
                  },
                  "query-input": "required name=tracking_number",
                },
              },
              {
                "@type": "WebPage",
                "@id": "https://shiprion.com/#webpage",
                url: "https://shiprion.com/",
                name: "Shiprion | Global Logistics Platform",
                isPartOf: { "@id": "https://shiprion.com/#website" },
                about: { "@id": "https://shiprion.com/#organization" },
                description:
                  "Ship smarter with Shiprion — enterprise logistics across 180+ countries.",
              },
            ],
          })}
        </script>
      </Helmet>
      <Navbar />
      <HeroSection />
      <FeaturesStrip />
      <AboutSection />
      <ServicesSection />
      <DeliveryTeamSection />
      <HowItWorksSection />
      <RateEstimatorSection />
      <TestimonialsSection />
      <ParallaxSection />
      <GlobalMapSection />
      <StatsBar />
      <TrustedBySection />
      <BlogSection />
      <ContainersMarqueeSection />
      <Footer />
    </div>
  );
}
