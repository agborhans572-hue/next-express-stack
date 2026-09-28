import { Shield, Clock, Star, ArrowRight, Package, Truck, MapPin, CheckCircle, Award } from "lucide-react";

const team = [
  {
    name: "Marcus Reid",
    role: "Senior Field Agent",
    region: "North America",
    deliveries: "12,400+",
    rating: 4.98,
    badge: "Elite",
    img: "/__mockup/images/delivery-guy-1.png",
    accent: "#6b7c3b",
  },
  {
    name: "Priya Anand",
    role: "Express Courier",
    region: "Asia Pacific",
    deliveries: "9,800+",
    rating: 4.96,
    badge: "Top Rated",
    img: "/__mockup/images/delivery-guy-2.png",
    accent: "#4a7c6b",
  },
  {
    name: "David & Tom",
    role: "Freight Specialists",
    region: "Europe",
    deliveries: "18,200+",
    rating: 4.99,
    badge: "Verified",
    img: "/__mockup/images/delivery-guy-3.png",
    accent: "#3b5c8c",
  },
];

const stats = [
  { icon: Package, value: "2.4M+", label: "Packages Delivered" },
  { icon: Clock, value: "99.4%", label: "On-Time Rate" },
  { icon: Star, value: "4.97", label: "Avg. Agent Rating" },
  { icon: Shield, value: "100%", label: "Insured Deliveries" },
];

export function DeliverySection() {
  return (
    <div className="min-h-screen bg-white font-['Inter'] overflow-hidden">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden">
        <img
          src="/__mockup/images/delivery-warehouse.png"
          alt="Shiprion Operations"
          className="w-full h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a]/80 via-[#0a0f1a]/50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-12 sm:px-20">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#8a9c4a]/20 border border-[#8a9c4a]/40 rounded-full px-3 py-1 mb-3">
              <Truck className="w-3 h-3 text-[#a8bc5a]" />
              <span className="text-[10px] font-bold text-[#a8bc5a] tracking-widest uppercase">Shiprion Operations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight max-w-xl">
              Delivered by People<br />
              <span className="text-[#a8bc5a]">Who Care.</span>
            </h1>
            <p className="text-gray-300 text-sm mt-2 max-w-sm">
              Every package is handled by certified Shiprion agents trained for speed, safety, and care.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="bg-[#0a0f1a] px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center py-6 gap-1">
              <Icon className="w-4 h-4 text-[#a8bc5a] mb-1" />
              <span className="text-2xl font-extrabold text-white">{value}</span>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="max-w-5xl mx-auto px-8 pt-16 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-[#8a9c4a]/10 border border-[#8a9c4a]/20 rounded-full px-3 py-1 mb-4">
          <Award className="w-3 h-3 text-[#6b7c3b]" />
          <span className="text-[10px] font-bold text-[#6b7c3b] tracking-widest uppercase">Certified Delivery Pros</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          The Team Behind Every Delivery
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Our agents are trained, vetted, and equipped with real-time tracking tools to ensure your cargo arrives exactly as promised.
        </p>
      </div>

      {/* ── Team cards ── */}
      <div className="max-w-5xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {team.map((member) => (
            <div
              key={member.name}
              className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Photo */}
              <div className="relative overflow-hidden h-64">
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badge */}
                <div
                  className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1"
                  style={{ backgroundColor: `${member.accent}22`, border: `1px solid ${member.accent}55` }}
                >
                  <CheckCircle className="w-3 h-3" style={{ color: member.accent }} />
                  <span className="text-[10px] font-bold" style={{ color: member.accent }}>{member.badge}</span>
                </div>

                {/* Region */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-white/80" />
                  <span className="text-xs text-white/80">{member.region}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-base font-bold text-gray-900 mb-0.5">{member.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{member.role}</p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Deliveries</p>
                    <p className="text-lg font-extrabold text-gray-900">{member.deliveries}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rating</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-extrabold text-gray-900">{member.rating}</span>
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

        {/* ── Package promise strip ── */}
        <div className="mt-10 rounded-2xl bg-[#0a0f1a] relative overflow-hidden px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, #a8bc5a 0%, transparent 50%), radial-gradient(circle at 80% 50%, #4a7c9a 0%, transparent 50%)"
            }}
          />

          {/* Icon boxes decorative */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-2 opacity-20 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-10 h-12 border-2 border-white/60 rounded-md"
                style={{ transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -4 : 4}px)` }}
              />
            ))}
          </div>

          <div className="relative">
            <h3 className="text-xl font-extrabold text-white mb-1">Your Package. Our Promise.</h3>
            <p className="text-gray-400 text-sm max-w-sm">
              Real-time updates, damage protection, and a 100% satisfaction guarantee on every shipment.
            </p>
          </div>
          <button className="relative shrink-0 flex items-center gap-2 bg-[#8a9c4a] hover:bg-[#a8bc5a] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors">
            Track Your Package <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
