const CONTAINER_IMAGES = [
  { img: "/images/containers/SHR-001.png", label: "SHIPRION", code: "SHR-001", route: "New York → Rotterdam", flag: "🇺🇸→🇳🇱" },
  { img: "/images/containers/MAE-441A.png", label: "MAERSK", code: "MAE-441A", route: "Shanghai → Hamburg", flag: "🇨🇳→🇩🇪" },
  { img: "/images/containers/COS-3346.png", label: "COSCO", code: "COS-3346", route: "Guangzhou → Los Angeles", flag: "🇨🇳→🇺🇸" },
  { img: "/images/containers/EVG-8831X.png", label: "EVERGREEN", code: "EVG-8831X", route: "Taipei → Amsterdam", flag: "🇹🇼→🇳🇱" },
  { img: "/images/containers/MSC-6629F.png", label: "MSC", code: "MSC-6629F", route: "Genoa → Singapore", flag: "🇮🇹→🇸🇬" },
  { img: "/images/containers/HPG-7712B.png", label: "HAPAG-LLOYD", code: "HPG-7712B", route: "Hamburg → Dubai", flag: "🇩🇪→🇦🇪" },
  { img: "/images/containers/CMA-77X.png", label: "CMA CGM", code: "CMA-77X", route: "Marseille → Tokyo", flag: "🇫🇷→🇯🇵" },
  { img: "/images/containers/YMG-14.png", label: "YANG MING", code: "YMG-14", route: "Kaohsiung → Long Beach", flag: "🇹🇼→🇺🇸" },
  { img: "/images/containers/OOC-7743C.png", label: "OOCL", code: "OOC-7743C", route: "Hong Kong → Sydney", flag: "🇭🇰→🇦🇺" },
  { img: "/images/containers/SHR-302.png", label: "SHIPRION", code: "SHR-302", route: "Chicago → London", flag: "🇺🇸→🇬🇧" },
  { img: "/images/containers/ZIM-58.png", label: "ZIM", code: "ZIM-58", route: "Haifa → New York", flag: "🇮🇱→🇺🇸" },
  { img: "/images/containers/NYK-447.png", label: "NYK LINE", code: "NYK-447", route: "Yokohama → Seattle", flag: "🇯🇵→🇺🇸" },
  { img: "/images/containers/SHR-088.png", label: "SHIPRION", code: "SHR-088", route: "Miami → Barcelona", flag: "🇺🇸→🇪🇸" },
  { img: "/images/containers/OCN-553.png", label: "OCEAN PRIME", code: "OCN-553", route: "Brisbane → Dubai", flag: "🇦🇺→🇦🇪" },
  { img: "/images/containers/PLT-22.png", label: "PILOT AIR", code: "PLT-22", route: "Sydney → Auckland", flag: "🇦🇺→🇳🇿" },
  { img: "/images/containers/SLD-991.png", label: "SEALAND", code: "SLD-991", route: "Boston → Amsterdam", flag: "🇺🇸→🇳🇱" },
  { img: "/images/containers/TRH-229.png", label: "TRANSHUB", code: "TRH-229", route: "Busan → Antwerp", flag: "🇰🇷→🇧🇪" },
  { img: "/images/containers/CGP-7.png", label: "CARGO PRIME", code: "CGP-7", route: "Osaka → Frankfurt", flag: "🇯🇵→🇩🇪" },
  { img: "/images/containers/FRX-09.png", label: "FREIGHTX", code: "FRX-09", route: "London → Mumbai", flag: "🇬🇧→🇮🇳" },
  { img: "/images/containers/GLX-2847.png", label: "GLOB EXPRESS", code: "GLX-2847", route: "Berlin → Toronto", flag: "🇩🇪→🇨🇦" },
];

function ContainerCard({ img, label, code, route, flag }: (typeof CONTAINER_IMAGES)[0]) {
  return (
    <div
      className="relative flex-shrink-0 rounded-xl overflow-hidden group cursor-pointer"
      style={{
        width: 340,
        height: 220,
        boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      {/* photo */}
      <img
        src={img}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />

      {/* dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.78) 100%)" }}
      />

      {/* top left — carrier badge */}
      <div className="absolute top-3 left-3">
        <span
          className="text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-widest"
          style={{ background: "rgba(100,120,60,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          {label}
        </span>
      </div>

      {/* top right — code */}
      <div className="absolute top-3 right-3">
        <span
          className="font-mono text-white/80 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          {code}
        </span>
      </div>

      {/* bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{route}</p>
            <p className="text-white/60 text-[11px] mt-0.5 font-mono">20'GP · ISO 668 · MAX 28T</p>
          </div>
          <div className="text-xl">{flag}</div>
        </div>
      </div>

      {/* hover ring */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ border: "1.5px solid rgba(140,160,80,0.6)", boxShadow: "inset 0 0 24px rgba(100,120,60,0.15)" }}
      />
    </div>
  );
}

export default function ContainersMarquee() {
  const doubled = [...CONTAINER_IMAGES, ...CONTAINER_IMAGES];
  return (
    <div className="bg-gray-50 py-12 overflow-hidden" style={{ position: "relative" }}>
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
      <div className="pointer-events-none absolute inset-y-0 left-0 w-40 z-10"
        style={{ background: "linear-gradient(to right, #f9fafb, transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40 z-10"
        style={{ background: "linear-gradient(to left, #f9fafb, transparent)" }} />

      <div className="containers-track px-4">
        {doubled.map((c, i) => (
          <ContainerCard key={i} {...c} />
        ))}
      </div>
    </div>
  );
}
