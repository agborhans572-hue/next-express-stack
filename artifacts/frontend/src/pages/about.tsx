import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/fade-in";
import { Link, useLocation } from "wouter";
import { useEliteAnimations } from "@/hooks/useEliteAnimations";
import { PublicNavbar } from "@/components/navbar";
import {
  Globe,
  ShieldCheck,
  Zap,
  HeartHandshake,
  Award,
  Users,
  Package,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Plane,
  Ship,
  Truck,
} from "lucide-react";

const STATS = [
  { value: 12, suffix: "+", label: "Years of Experience" },
  { value: 180, suffix: "+", label: "Countries Served" },
  { value: 2.5, suffix: "M", decimals: 1, label: "Shipments Delivered" },
  { value: 98.7, suffix: "%", decimals: 1, label: "On-Time Delivery Rate" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Integrity",
    desc: "We operate with full transparency — every shipment, every tracking update, every invoice is honest and accurate.",
  },
  {
    icon: Zap,
    title: "Speed",
    desc: "Time is money in logistics. Our global partnerships and smart routing ensure fastest possible transit times.",
  },
  {
    icon: HeartHandshake,
    title: "Partnership",
    desc: "We treat every client relationship as long-term. Your cargo's success is our reputation.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    desc: "With hubs on every continent and partnerships with 400+ carriers, we move freight anywhere on earth.",
  },
];

const TEAM = [
  {
    name: "Marcus Okafor",
    role: "Chief Executive Officer",
    bio: "20 years building freight solutions across North America and Europe. Former VP at DHL Global Forwarding.",
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    location: "Dallas, Texas",
  },
  {
    name: "Sophie Chen",
    role: "Chief Operations Officer",
    bio: "Supply-chain engineer who oversaw Asia-Pacific hub expansion. Led 300% capacity growth at previous carrier.",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
    location: "Singapore",
  },
  {
    name: "Daniel Reyes",
    role: "Head of Technology",
    bio: "Built real-time tracking platforms handling 10M+ events per day. Passionate about AI-driven route optimisation.",
    img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop",
    location: "Miami, USA",
  },
  {
    name: "Amara Diallo",
    role: "Director of Compliance",
    bio: "Customs and trade regulation expert with deep expertise in US, EU, and Latin American import/export law.",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    location: "Atlanta, Georgia",
  },
];

const MILESTONES = [
  {
    year: "2012",
    event:
      "Shiprion founded with 3 employees and a single warehouse in Houston, TX.",
  },
  {
    year: "2015",
    event:
      "Expanded to 14 US states and Canada; launched first air-freight corridor.",
  },
  {
    year: "2017",
    event: "Opened European hub in Frankfurt; fleet grew to 120 trucks.",
  },
  {
    year: "2019",
    event:
      "Launched real-time package tracking platform used by 50,000+ clients.",
  },
  { year: "2021", event: "Passed 1 million cumulative deliveries milestone." },
  {
    year: "2023",
    event: "Added sea freight division; now operating across 180+ countries.",
  },
  {
    year: "2024",
    event:
      "Achieved ISO 9001:2015 quality certification across all major hubs.",
  },
];

export default function AboutPage() {
  const [, setLocation] = useLocation();
  useEliteAnimations();

  return (
    <>
      <Helmet>
        <title>
          About Shiprion | Our Story, Mission & Global Logistics Team
        </title>
        <meta
          name="description"
          content="Learn how Shiprion became a trusted global logistics partner — our founding story, core values, technology-first approach, and the team behind every delivery across 180+ countries."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/about" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="About Shiprion | Our Story, Mission & Global Logistics Team"
        />
        <meta
          property="og:description"
          content="Discover the story behind Shiprion — our mission, values, and the team powering logistics across 180+ countries."
        />
        <meta property="og:url" content="https://shiprion.com/about" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta
          property="og:image:alt"
          content="About Shiprion — Global Logistics"
        />
        <meta
          name="twitter:title"
          content="About Shiprion | Our Story & Mission"
        />
        <meta
          name="twitter:description"
          content="Discover the story behind Shiprion — technology-first logistics across 180+ countries."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            url: "https://shiprion.com/about",
            name: "About Shiprion",
            description:
              "Shiprion is a technology-first global logistics platform delivering air, road, and ocean freight services across 180+ countries.",
            publisher: {
              "@type": "Organization",
              name: "Shiprion",
              url: "https://shiprion.com",
            },
          })}
        </script>
      </Helmet>

      <PublicNavbar />

      <section className="relative bg-white text-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-olive-500/8 rounded-full blur-[200px] animate-orb pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[160px] animate-orb-alt pointer-events-none" />
        <img
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1600&h=700&fit=crop&fm=webp"
          alt="Global logistics"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="relative max-w-7xl mx-auto px-6 py-32 md:py-44">
          <FadeIn direction="up">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              Our Story
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl mb-6">
              Moving the world's cargo —{" "}
              <span className="text-gradient-olive">with purpose.</span>
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl leading-relaxed">
              Shiprion was founded on a simple belief: that reliable, affordable
              global shipping should be accessible to every business — from a
              one-person start-up to a multinational enterprise.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-200">
        <StaggerList className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <StaggerItem key={s.label}>
              <p className="text-3xl md:text-4xl font-extrabold text-gray-900">
                <span
                  className="gsap-scrub-counter"
                  data-target={String(s.value)}
                  data-decimals={String(s.decimals || 0)}
                  data-suffix={s.suffix}
                >
                  {(0).toFixed(s.decimals || 0)}
                  {s.suffix}
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-olive-500/5 rounded-full blur-[180px] animate-orb pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <FadeIn direction="left">
            <div>
              <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Who We Are
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                A logistics company built on trust and technology.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                Since 2012, Shiprion has connected businesses and consumers
                across 180+ countries through air freight, sea freight, road
                haulage, and express courier services. We combine a global
                carrier network with proprietary tracking technology to give
                every client full visibility and control over their supply
                chain.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Whether you're shipping a single parcel or managing a
                multi-container trade lane, our operations team works around the
                clock to keep your cargo moving — safely, compliantly, and on
                time.
              </p>
              <div className="space-y-3">
                {[
                  "ISO 9001:2015 certified operations",
                  "24/7 dedicated customer support",
                  "Real-time GPS tracking on all shipments",
                  "Cargo insurance on every consignment",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-olive-400 shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={0.15}>
            <div className="grid grid-cols-2 gap-3">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop&fm=webp"
                alt="Warehouse operations"
                loading="lazy"
                decoding="async"
                className="rounded-2xl w-full h-52 object-cover border border-gray-200"
              />
              <img
                src="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=600&h=400&fit=crop&fm=webp"
                alt="Cargo ship"
                loading="lazy"
                decoding="async"
                className="rounded-2xl w-full h-52 object-cover mt-6 border border-gray-200"
              />
              <img
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop&fm=webp"
                alt="Freight truck"
                loading="lazy"
                decoding="async"
                className="rounded-2xl w-full h-52 object-cover -mt-6 border border-gray-200"
              />
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop&fm=webp"
                alt="Air freight"
                loading="lazy"
                decoding="async"
                className="rounded-2xl w-full h-52 object-cover border border-gray-200"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn direction="up" className="text-center mb-16">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              What Drives Us
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Our Core Values
            </h2>
          </FadeIn>
          <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <motion.div
                  whileHover={{ y: -4, borderColor: "rgba(156,167,99,0.3)" }}
                  className="gsap-blur-pop bg-white backdrop-blur-xl rounded-2xl p-8 border border-gray-200 hover:bg-gray-50 transition-all duration-300 h-full"
                >
                  <div className="w-12 h-12 bg-olive-500/10 border border-olive-500/20 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-olive-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-olive-500/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn direction="up" className="text-center mb-16">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              What We Do
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Shipping solutions for every need
            </h2>
          </FadeIn>
          <StaggerList className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Plane,
                title: "Air Freight",
                desc: "Fastest transit times for time-critical cargo. Direct consolidation and charter options across 6 continents.",
                stat: "24–72 hr delivery",
              },
              {
                icon: Ship,
                title: "Sea Freight",
                desc: "FCL and LCL container shipping. Port-to-port and door-to-door with live vessel tracking.",
                stat: "180+ port pairs",
              },
              {
                icon: Truck,
                title: "Road & Express",
                desc: "Last-mile courier and long-haul trucking. Cross-border road freight across the Americas and Europe.",
                stat: "120+ truck fleet",
              },
            ].map(({ icon: Icon, title, desc, stat }) => (
              <StaggerItem key={title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="gsap-tilt-card bg-white backdrop-blur-xl rounded-2xl p-8 border border-gray-200 hover:border-olive-500/20 transition-all duration-300 h-full"
                >
                  <div className="w-12 h-12 bg-olive-500/10 border border-olive-500/20 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-olive-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    {desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-olive-400 text-xs font-semibold bg-olive-500/10 px-3 py-1.5 rounded-full">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {stat}
                  </span>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-28 bg-gray-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <FadeIn direction="up" className="text-center mb-16">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Our Journey
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Milestones that shaped us
            </h2>
          </FadeIn>
          <div className="relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-olive-500/40 via-olive-500/20 to-transparent hidden sm:block" />
            <div className="space-y-6">
              {MILESTONES.map(({ year, event }, i) => (
                <FadeIn key={year} direction="left" delay={i * 0.06}>
                  <div className="flex gap-6 items-start">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-olive-500 text-white flex items-center justify-center text-xs font-bold shadow-lg glow-olive-sm z-10">
                      {year.slice(2)}
                    </div>
                    <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 px-6 py-4 flex-1">
                      <p className="text-olive-400 text-xs font-bold mb-1">
                        {year}
                      </p>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {event}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-olive-500/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn direction="up" className="text-center mb-16">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Leadership
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Meet the team
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Experienced operators and technologists united by one mission —
              delivering your cargo without compromise.
            </p>
          </FadeIn>
          <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, bio, img, location }) => (
              <StaggerItem key={name}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="gsap-tilt-card group text-center bg-white backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-200 hover:border-olive-500/20 transition-all duration-300"
                >
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={img}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900">
                      {name}
                    </h3>
                    <p className="text-olive-400 text-xs font-semibold mt-0.5 mb-3">
                      {role}
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-3">
                      {bio}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-gray-600 text-xs">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      <section className="py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <FadeIn direction="left">
            <div>
              <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Why Shiprion
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                The logistics partner that keeps its promises.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Hundreds of freight companies exist. Very few combine the global
                network, the technology, and the people needed to consistently
                deliver at scale. Here's what makes us different.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: Clock,
                    title: "Real-time visibility",
                    desc: "Track every parcel to the minute, across every mode.",
                  },
                  {
                    icon: Award,
                    title: "Certified quality",
                    desc: "ISO 9001 processes mean zero surprises for your cargo.",
                  },
                  {
                    icon: Users,
                    title: "Dedicated account team",
                    desc: "One point of contact from pickup to final delivery.",
                  },
                  {
                    icon: Package,
                    title: "Any size, any cargo",
                    desc: "Single parcels to 40ft containers — we handle it all.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-olive-500/10 border border-olive-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-olive-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-0.5">
                        {title}
                      </p>
                      <p className="text-gray-500 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn direction="right" delay={0.15}>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop&fm=webp"
                alt="Warehouse team"
                loading="lazy"
                decoding="async"
                className="rounded-2xl w-full h-80 object-cover border border-gray-200"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -left-6 bg-olive-500 text-white rounded-2xl p-6 shadow-xl glow-olive"
              >
                <p className="text-3xl font-extrabold">98.7%</p>
                <p className="text-olive-100 text-sm mt-1">On-Time Delivery</p>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-olive-500/8 rounded-full blur-[200px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <FadeIn direction="up">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
              Ready to ship with us?
            </h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              Join over 50,000 businesses who trust Shiprion to move their cargo
              reliably, anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/calculator"
                className="flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-bold px-8 py-4 rounded-xl transition-colors text-sm glow-olive"
              >
                Get a Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-900 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Talk to Sales
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 text-gray-600 py-10 text-center text-sm">
        <p>
          © {new Date().getFullYear()} Shiprion Logistics. All rights reserved.
        </p>
      </footer>
    </>
  );
}
