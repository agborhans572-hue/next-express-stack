import { ArrowRight, Package, Mail, Phone, Clock, Globe, Zap, Send, CheckCircle, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const DOMAIN = "https://8108aed1-e937-4bb7-9fa6-b4c51a892fe6-00-2gso03b617a2s.spock.replit.dev";

const navLinks = [
  { label: "Home" }, { label: "About Us" },
];
const routeLinks = [
  { label: "Services" }, { label: "Track Package" }, { label: "News & Insights" },
];
const solutionLinks = [
  { label: "Air Freight" }, { label: "Road Freight" },
  { label: "Ocean Freight" }, { label: "Rate Calculator" }, { label: "Contact Us" },
];
const legalLinks = [
  { label: "Privacy Policy" }, { label: "Terms & Conditions" },
  { label: "Cookie Policy" }, { label: "FAQ" },
];

export function Footer() {
  return (
    <div className="min-h-screen bg-white">
      <footer className="relative overflow-hidden bg-white border-t border-gray-200">

        {/* World map — no overlay, clean image */}
        <img
          src={`${DOMAIN}/images/footer-map.png`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{ opacity: 1, filter: "grayscale(100%) brightness(0.88)", mixBlendMode: "multiply" }}
        />

        <div className="relative">

          {/* CTA strip */}
          <div className="border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-14">
              <div className="relative rounded-2xl bg-white border border-gray-200 shadow-sm px-8 py-10 sm:px-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute inset-0 bg-gradient-to-br from-olive-500/[0.04] via-transparent to-transparent rounded-2xl pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-olive-400/[0.06] rounded-full blur-[100px] pointer-events-none" />
                <div className="relative text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-olive-500/10 border border-olive-500/20 rounded-full px-3 py-1 mb-3">
                    <Zap className="h-3 w-3 text-olive-500" />
                    <span className="text-[10px] font-bold text-olive-600 tracking-widest uppercase">Ready to ship?</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                    Move cargo smarter, faster.
                  </h3>
                  <p className="text-gray-500 text-sm mt-1.5 max-w-sm">
                    Join 40,000+ businesses shipping with Shiprion across 180+ countries.
                  </p>
                </div>
                <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
                  <button className="h-11 px-6 bg-olive-500 hover:bg-olive-400 text-white font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2">
                    Get a Quote <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="h-11 px-6 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-lg transition-all">
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

              {/* Brand */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 bg-olive-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-900 font-extrabold text-xl">
                    Shiprion<span className="text-olive-500">.</span>
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-500 mb-5 max-w-xs">
                  Enterprise logistics platform for air, road, and ocean freight. Real-time tracking, AI-optimized routing, and 24/7 operations support.
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600">All systems operational</span>
                </div>
                <div className="space-y-2.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2 hover:text-olive-500 transition-colors cursor-pointer">
                    <Mail className="h-3.5 w-3.5 text-olive-500 shrink-0" /> hello@shiprion.com
                  </div>
                  <div className="flex items-center gap-2 hover:text-olive-500 transition-colors cursor-pointer">
                    <Phone className="h-3.5 w-3.5 text-olive-500 shrink-0" /> +1 (478) 500-1234
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-olive-500 shrink-0" />
                    <span>24/7 operations support</span>
                  </div>
                </div>
              </div>

              {/* Platform */}
              <div>
                <h4 className="text-gray-900 font-bold mb-5 text-[10px] uppercase tracking-[0.18em]">Platform</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  {[...navLinks, ...routeLinks].map(({ label }) => (
                    <li key={label}>
                      <span className="hover:text-olive-500 transition-colors flex items-center gap-1.5 group cursor-pointer">
                        <ArrowRight className="h-3 w-3 text-olive-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <h4 className="text-gray-900 font-bold mb-5 text-[10px] uppercase tracking-[0.18em]">Solutions</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  {solutionLinks.map(({ label }) => (
                    <li key={label}>
                      <span className="hover:text-olive-500 transition-colors flex items-center gap-1.5 group cursor-pointer">
                        <ArrowRight className="h-3 w-3 text-olive-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-gray-900 font-bold mb-5 text-[10px] uppercase tracking-[0.18em]">Legal</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  {legalLinks.map(({ label }) => (
                    <li key={label}>
                      <span className="hover:text-olive-500 transition-colors flex items-center gap-1.5 group cursor-pointer">
                        <ArrowRight className="h-3 w-3 text-olive-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter */}
            <div className="border-t border-gray-100 pt-10 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="text-gray-900 font-bold text-sm mb-1">Stay ahead of the supply chain</p>
                  <p className="text-xs text-gray-500">Weekly logistics intel, straight to your inbox. No spam, unsubscribe anytime.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="flex-1 md:w-64 h-10 bg-white border border-gray-200 focus:border-olive-400 rounded-lg px-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors shadow-sm"
                  />
                  <button className="h-10 px-4 bg-olive-500 hover:bg-olive-400 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-1.5 shrink-0 shadow-sm">
                    Subscribe <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                <Globe className="h-3.5 w-3.5 text-olive-500" />
                <span>&copy; {new Date().getFullYear()} Shiprion Logistics. All rights reserved.</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">180+ countries served</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">99.4% on-time delivery</span>
              </div>
              <div className="flex items-center gap-2">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <button
                    key={i}
                    className="group w-9 h-9 rounded-lg bg-white hover:bg-olive-50 border border-gray-200 hover:border-olive-300 flex items-center justify-center transition-all duration-200 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-olive-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
