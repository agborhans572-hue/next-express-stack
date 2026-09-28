import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { ARTICLES } from "@/data/articles";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Tag,
  Share2,
  Twitter,
  Linkedin,
} from "lucide-react";

export default function NewsArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const article = ARTICLES.find((a) => a.slug === slug);
  const others = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);

  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <PublicNavbar />
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Article not found
          </h1>
          <p className="text-gray-500 mb-8">
            This article doesn't exist or may have been moved.
          </p>
          <Link href="/news">
            <button className="flex items-center gap-2 mx-auto bg-olive-500 hover:bg-olive-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors glow-olive-sm">
              <ArrowLeft className="h-4 w-4" /> Back to News
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Helmet>
        <title>{article.title} — Shiprion</title>
        <meta name="description" content={article.excerpt} />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href={`https://shiprion.com/news/${article.slug}`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${article.title} — Shiprion`} />
        <meta property="og:description" content={article.excerpt} />
        <meta
          property="og:url"
          content={`https://shiprion.com/news/${article.slug}`}
        />
        <meta property="og:image" content={article.img} />
        <meta property="og:image:alt" content={article.title} />
        <meta property="article:publisher" content="https://shiprion.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${article.title} — Shiprion`} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.img} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            description: article.excerpt,
            image: article.img,
            url: `https://shiprion.com/news/${article.slug}`,
            publisher: {
              "@type": "Organization",
              name: "Shiprion",
              url: "https://shiprion.com",
              logo: {
                "@type": "ImageObject",
                url: "https://shiprion.com/favicon.svg",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://shiprion.com/news/${article.slug}`,
            },
          })}
        </script>
      </Helmet>

      <PublicNavbar />

      <div className="relative h-[420px] md:h-[520px] overflow-hidden bg-white">
        <img
          src={article.img}
          alt={article.title}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute top-6 left-6 z-10">
          <Link href="/news">
            <motion.button
              whileHover={{ x: -3 }}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors bg-gray-50 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to News
            </motion.button>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 md:px-16">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block bg-olive-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 glow-olive-sm">
              {article.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-olive-500/20 flex items-center justify-center text-olive-400 font-bold text-xs shrink-0">
                  {article.author.charAt(0)}
                </div>
                <span className="font-medium text-gray-800">
                  {article.author}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500 text-xs">
                  {article.authorRole}
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {article.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <FadeIn direction="up">
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium border-l-4 border-olive-500 pl-5 mb-10">
              {article.excerpt}
            </p>
          </FadeIn>

          {article.body.map((para, i) => (
            <FadeIn key={i} direction="up" delay={i * 0.04}>
              <p className="text-gray-500 leading-[1.85] mb-6 text-base">
                {para}
              </p>
            </FadeIn>
          ))}

          <FadeIn direction="up" delay={0.1}>
            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Tag className="h-4 w-4" />
                <span className="font-medium">{article.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Share:
                </span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-300 hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30 text-gray-500 flex items-center justify-center transition-all"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-300 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 text-gray-500 flex items-center justify-center transition-all"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {others.length > 0 && (
        <section className="bg-white py-16 px-6 border-t border-gray-200">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-extrabold text-gray-900">
                More from Shiprion
              </h2>
              <Link href="/news">
                <span className="flex items-center gap-1 text-sm text-olive-400 font-semibold hover:gap-2 transition-all">
                  All articles <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {others.map((a, i) => (
                <FadeIn key={a.id} direction="up" delay={i * 0.06}>
                  <Link href={`/news/${a.slug}`}>
                    <motion.div
                      whileHover={{
                        y: -4,
                        borderColor: "rgba(156,167,99,0.3)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 22,
                      }}
                      className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 overflow-hidden cursor-pointer h-full group"
                    >
                      <div className="h-40 overflow-hidden">
                        <img
                          src={a.img}
                          alt={a.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-semibold text-olive-400 bg-olive-500/10 px-2 py-0.5 rounded-full">
                          {a.category}
                        </span>
                        <h3 className="mt-2 text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-olive-400 transition-colors">
                          {a.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {a.date}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-6 bg-gray-50 border-t border-gray-200 text-gray-900 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-olive-500/5 rounded-full blur-[160px] pointer-events-none" />
        <FadeIn direction="up" className="max-w-xl mx-auto relative z-10">
          <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Talk to Operations
          </p>
          <h2 className="text-2xl font-extrabold mb-3">
            Put these insights to work
          </h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Share your route and cargo details with our logistics team.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm glow-olive-sm"
          >
            Contact Shiprion <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </section>

      <footer className="bg-white border-t border-gray-200 text-gray-600 py-8 px-6 text-center text-xs">
        <p>
          © {new Date().getFullYear()} Shiprion Logistics. All rights reserved.
        </p>
      </footer>
    </>
  );
}
