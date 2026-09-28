import { Helmet } from "react-helmet-async";
import { FadeIn } from "@/components/fade-in";
import { PublicNavbar } from "@/components/navbar";
import { Link } from "wouter";
import {
  ArrowLeft,
  Cookie,
  Shield,
  BarChart3,
  Target,
  Settings,
  Globe,
  Mail,
} from "lucide-react";

const LAST_UPDATED = "May 19, 2026";

const COOKIE_TYPES = [
  {
    name: "Essential Cookies",
    required: true,
    icon: Shield,
    description:
      "These cookies are strictly necessary for the operation of our platform. They enable core functionality such as security, authentication, and accessibility.",
    examples: [
      {
        cookie: "session_id",
        purpose: "Maintains your login session securely",
        duration: "Session",
      },
      {
        cookie: "csrf_token",
        purpose: "Prevents cross-site request forgery attacks",
        duration: "Session",
      },
      {
        cookie: "cookieChoice",
        purpose: "Stores your cookie preference choice",
        duration: "1 year",
      },
    ],
  },
  {
    name: "Analytics Cookies",
    required: false,
    icon: BarChart3,
    description:
      "These cookies help us understand how visitors interact with our platform by collecting anonymous usage data.",
    examples: [
      {
        cookie: "_ga / _gid",
        purpose:
          "Google Analytics — tracks page views and user journeys anonymously",
        duration: "2 years / 24 hours",
      },
      {
        cookie: "_hp_id",
        purpose: "Heap Analytics — records anonymized user interactions",
        duration: "1 year",
      },
    ],
  },
  {
    name: "Functional Cookies",
    required: false,
    icon: Settings,
    description:
      "These cookies enable enhanced functionality and personalization. They remember your preferences and settings.",
    examples: [
      {
        cookie: "theme_pref",
        purpose: "Remembers your preferred visual theme",
        duration: "1 year",
      },
      {
        cookie: "recent_tracking",
        purpose: "Stores your recently tracked shipment numbers",
        duration: "30 days",
      },
    ],
  },
];

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Helmet>
        <title>Cookie Policy — Shiprion</title>
        <meta
          name="description"
          content="Shiprion's Cookie Policy — learn which cookies we use, their purpose, and how to manage your cookie preferences."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/cookies" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Cookie Policy — Shiprion" />
        <meta
          property="og:description"
          content="Learn which cookies Shiprion uses, their purpose, and how to manage your cookie preferences."
        />
        <meta property="og:url" content="https://shiprion.com/cookies" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta name="twitter:title" content="Cookie Policy — Shiprion" />
        <meta
          name="twitter:description"
          content="Which cookies Shiprion uses and how to manage your preferences."
        />
      </Helmet>

      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-olive-500/[0.04] blur-[120px] pointer-events-none animate-orb" />
      <div className="fixed bottom-[-15%] right-[10%] w-[400px] h-[400px] rounded-full bg-olive-500/[0.03] blur-[100px] pointer-events-none animate-orb-alt" />

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
                <Cookie className="h-6 w-6 text-olive-400" />
              </div>
              <div>
                <p className="text-olive-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
                  Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Cookie Policy
                </h1>
              </div>
            </div>
            <p className="text-gray-500 mt-4 text-base leading-relaxed max-w-2xl">
              We use cookies and similar technologies to enhance your
              experience, analyze platform usage, and remember your preferences.
            </p>
            <p className="text-gray-500 text-sm mt-3">
              Last updated: {LAST_UPDATED}
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-12 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-olive-500/10 flex items-center justify-center shrink-0">
                  <Globe className="h-4.5 w-4.5 text-olive-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  What Are Cookies?
                </h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Cookies are small text files stored on your device. We use them
                to keep the app secure, remember your choices, and improve
                performance.
              </p>
            </div>
          </FadeIn>

          <div className="mt-8 space-y-6">
            {COOKIE_TYPES.map((type, i) => {
              const Icon = type.icon;
              return (
                <FadeIn key={type.name} delay={0.12 + i * 0.03}>
                  <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-olive-500/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4.5 w-4.5 text-olive-400" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {type.name}
                        </h2>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${type.required ? "text-olive-400 bg-olive-500/10 border-olive-500/20" : "text-gray-500 bg-gray-50 border-gray-300"}`}
                      >
                        {type.required ? "Always Active" : "Optional"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">
                      {type.description}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-gray-500 font-semibold pb-3 pr-4">
                              Cookie
                            </th>
                            <th className="text-left text-gray-500 font-semibold pb-3 pr-4">
                              Purpose
                            </th>
                            <th className="text-left text-gray-500 font-semibold pb-3">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {type.examples.map((ex, j) => (
                            <tr
                              key={j}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="py-2.5 pr-4 text-olive-400 font-mono text-xs whitespace-nowrap">
                                {ex.cookie}
                              </td>
                              <td className="py-2.5 pr-4 text-gray-500">
                                {ex.purpose}
                              </td>
                              <td className="py-2.5 text-gray-500 whitespace-nowrap">
                                {ex.duration}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-8 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
              <Mail className="h-6 w-6 text-olive-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Questions About Cookies?
              </h3>
              <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                If you have questions about our use of cookies, get in touch.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-white text-sm font-semibold rounded-xl transition-colors glow-olive-sm"
                >
                  <Mail className="h-4 w-4" /> Contact Us
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-olive-400 hover:text-olive-300 transition-colors"
                >
                  Read our Privacy Policy
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
