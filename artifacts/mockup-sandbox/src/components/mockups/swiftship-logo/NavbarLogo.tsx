import { Truck, PlaneTakeoff } from "lucide-react";

export function NavbarLogo() {
  const olive = "#9CA763";
  const oliveDim = "#7a8750";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex items-center gap-3 font-bold text-xl text-gray-900">
        {/* Combined truck + plane icon badge */}
        <div
          className="relative flex items-center justify-center rounded-xl overflow-hidden shrink-0"
          style={{
            width: 40,
            height: 40,
            background: `linear-gradient(135deg, ${olive} 0%, ${oliveDim} 100%)`,
            boxShadow: `0 0 14px rgba(156,167,99,0.45), 0 2px 8px rgba(0,0,0,0.12)`,
          }}
        >
          {/* Truck — bottom-left, main icon */}
          <Truck
            style={{
              position: "absolute",
              bottom: 5,
              left: 4,
              width: 20,
              height: 20,
              color: "#fff",
              opacity: 1,
            }}
          />
          {/* Plane — top-right, smaller accent */}
          <PlaneTakeoff
            style={{
              position: "absolute",
              top: 4,
              right: 3,
              width: 13,
              height: 13,
              color: "rgba(255,255,255,0.85)",
            }}
          />
          {/* Subtle diagonal separator */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, transparent 52%, rgba(255,255,255,0.08) 52%)",
            }}
          />
        </div>

        {/* Brand text */}
        <span className="tracking-tight text-gray-900">
          Shiprion<span style={{ color: olive }}>.</span>
        </span>
      </div>
    </div>
  );
}
