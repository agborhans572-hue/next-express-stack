import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/fade-in";
import { useLocation, Link } from "wouter";
import { PublicNavbar } from "@/components/navbar";
import { ARTICLES, CATEGORIES } from "@/data/articles";
import {
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  Search,
  TrendingUp,
  Globe,
  Truck,
  Package,
  Zap,
  ChevronRight,
} from "lucide-react";

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Company News": Package,
  Industry: Globe,
  Technology: Zap,
  Sustainability: TrendingUp,
  Events: Calendar,
};

export default function NewsPage() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const featured = ARTICLES.find((a) => a.featured)!;
  const rest = ARTICLES.filter((a) => !a.featured);

  const filtered = rest.filter((a) => {
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Helmet>
        <title>News & Insights | Logistics Industry Updates — Shiprion</title>
        <meta
          name="description"
          content="Stay ahead with Shiprion's latest news, logistics industry insights, supply chain trends, and company updates. Expert analysis from our global freight team."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/news" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="News & Insights | Logistics Industry Updates — Shiprion"
        />
        <meta
          property="og:description"
          content="Latest logistics industry news, supply chain trends, and company updates from Shiprion's global freight team."
        />
        <meta property="og:url" content="https://shiprion.com/news" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta property="og:image:alt" content="Shiprion News & Insights" />
        <meta name="twitter:title" content="News & Insights — Shiprion" />
        <meta
          name="twitter:description"
          content="Latest logistics news, supply chain trends, and company updates from Shiprion."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            url: "https://shiprion.com/news",
            name: "Shiprion News & Insights",
            description:
              "Logistics industry news, supply chain trends, and company updates from Shiprion.",
            publisher: {
              "@type": "Organization",
              name: "Shiprion",
              url: "https://shiprion.com",
              logo: {
                "@type": "ImageObject",
                url: "https://shiprion.com/favicon.svg",
              },
            },
          })}
        </script>
      </Helmet>

      <PublicNavbar />

      <section className="bg-white text-gray-900 py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-olive-500/8 rounded-full blur-[180px] animate-orb pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <FadeIn direction="up">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              Shiprion Newsroom
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5">
              News & <span className="text-gradient-olive">Insights</span>
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
              Company updates, industry trends, and logistics intelligence — all
              in one place.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.3}>
            <div className="mt-8 max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-olive-500/40 focus:border-olive-500/40 transition-all"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {!searchQuery && activeCategory === "All" && (
        <section className="bg-gray-50 py-16 px-6 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
              Featured Story
            </p>
            <Link href={`/news/${featured.slug}`}>
              <FadeIn direction="up">
                <div className="grid md:grid-cols-2 gap-10 items-center cursor-pointer group">
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200">
                    <img
                      src={featured.img}
                      alt={featured.title}
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-olive-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {featured.category}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {featured.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {featured.readTime}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight group-hover:text-olive-400 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-olive-500/20 rounded-full flex items-center justify-center text-olive-400 font-bold text-sm">
                          {featured.author.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {featured.author}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-olive-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                        Read Article <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </Link>
          </div>
        </section>
      )}

      <section className="bg-white/95 backdrop-blur-xl py-5 px-6 border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const CatIcon =
              cat !== "All" ? CATEGORY_ICONS[cat] || Tag : undefined;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-olive-500 text-white shadow-sm glow-olive-sm"
                    : "bg-gray-50 text-gray-500 border border-gray-300 hover:border-olive-500/30 hover:text-olive-400"
                }`}
              >
                {CatIcon && <CatIcon className="h-3.5 w-3.5" />}
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base">
                No articles found. Try a different search or category.
              </p>
            </div>
          ) : (
            <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article) => (
                <StaggerItem key={article.id}>
                  <Link href={`/news/${article.slug}`} className="block h-full">
                    <motion.article
                      whileHover={{
                        y: -4,
                        borderColor: "rgba(156,167,99,0.3)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 22,
                      }}
                      className="group bg-white backdrop-blur-xl rounded-2xl border border-gray-200 overflow-hidden cursor-pointer h-full"
                    >
                      <div className="relative overflow-hidden h-48">
                        <img
                          src={article.img}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-gray-100 backdrop-blur-sm text-gray-900 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-300">
                          {article.category}
                        </span>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {article.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {article.readTime}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-olive-400 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-olive-500/20 rounded-full flex items-center justify-center text-olive-400 font-bold text-xs">
                              {article.author.charAt(0)}
                            </div>
                            <span className="text-xs text-gray-500">
                              {article.author}
                            </span>
                          </div>
                          <span className="text-olive-400 text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                            Read <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </section>

      <section className="py-24 px-6 bg-white border-t border-gray-200 text-gray-900 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-olive-500/5 rounded-full blur-[180px] pointer-events-none" />
        <FadeIn direction="up" className="max-w-xl mx-auto relative z-10">
          <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Talk to Operations
          </p>
          <h2 className="text-3xl font-extrabold mb-4">
            Put these insights to work
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Planning a route or working through a logistics constraint? Send the
            details to our team for practical support.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm glow-olive-sm"
          >
            Contact Shiprion <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </section>

      <section className="py-14 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Ready to ship with Shiprion?
            </h3>
            <p className="text-gray-500 text-sm">
              Join 50,000+ businesses using Shiprion globally.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/calculator"
              className="flex items-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm glow-olive-sm"
            >
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 border border-gray-300 text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 text-gray-600 py-8 px-6 text-center text-xs">
        <p>
          © {new Date().getFullYear()} Shiprion Logistics. All rights reserved.
        </p>
      </footer>
    </>
  );
}
