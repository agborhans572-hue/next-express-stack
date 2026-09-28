import { Truck, PlaneTakeoff, MapPin } from "lucide-react";

export function FooterLogo() {
  const olive = "#9CA763";
  const oliveDim = "#7a8750";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <footer className="w-full border-t border-gray-200 pt-10 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Top row: big logo + tagline left, links right */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-8">

            {/* Logo + tagline */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* Big icon badge */}
                <div
                  className="relative flex items-center justify-center rounded-2xl shrink-0"
                  style={{
                    width: 56,
                    height: 56,
                    background: `linear-gradient(135deg, ${olive} 0%, ${oliveDim} 100%)`,
                    boxShadow: `0 0 22px rgba(156,167,99,0.4), 0 4px 14px rgba(0,0,0,0.12)`,
                  }}
                >
                  <Truck
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 6,
                      width: 26,
                      height: 26,
                      color: "#fff",
                    }}
                  />
                  <PlaneTakeoff
                    style={{
                      position: "absolute",
                      top: 7,
                      right: 5,
                      width: 17,
                      height: 17,
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

                {/* Brand name — bigger */}
                <div>
                  <div
                    className="font-extrabold text-gray-900 leading-none tracking-tight"
                    style={{ fontSize: 28 }}
                  >
                    Shiprion<span style={{ color: olive }}>.</span>
                  </div>
                  <div
                    className="text-gray-400 font-medium mt-0.5"
                    style={{ fontSize: 11, letterSpacing: "0.1em" }}
                  >
                    GLOBAL LOGISTICS
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Reliable freight &amp; express delivery to 180+ countries,
                24/7.
              </p>

              {/* Location badge */}
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                <MapPin className="w-3 h-3" style={{ color: olive }} />
                Houston, TX · Frankfurt · Singapore
              </div>
            </div>

            {/* Quick links */}
            <div className="flex gap-10 text-sm text-gray-500">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-700 text-xs uppercase tracking-widest mb-1">
                  Company
                </span>
                {["About Us", "Services", "News", "Careers"].map((l) => (
                  <span
                    key={l}
                    className="hover:text-gray-900 cursor-pointer transition-colors"
                  >
                    {l}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-700 text-xs uppercase tracking-widest mb-1">
                  Support
                </span>
                {["Track Order", "FAQ", "Contact", "Privacy"].map((l) => (
                  <span
                    key={l}
                    className="hover:text-gray-900 cursor-pointer transition-colors"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom divider + copyright */}
          <div className="border-t border-gray-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>© {new Date().getFullYear()} Shiprion Logistics. All rights reserved.</span>
            <div className="flex items-center gap-1" style={{ color: olive }}>
              <Truck className="w-3 h-3" />
              <PlaneTakeoff className="w-3 h-3" />
              <span className="text-gray-400 ml-1">Air · Ground · Sea</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
