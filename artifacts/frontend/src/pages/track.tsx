import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/navbar";
import { ShipmentMap } from "@/components/ShipmentMap";
import {
  useTrackShipment,
  getTrackShipmentQueryKey,
} from "@workspace/api-client-react";
import { useShipmentUpdates } from "@/hooks/useShipmentUpdates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/fade-in";
import {
  Package,
  Search,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Weight,
  Home,
  Wifi,
  Plane,
  Ship,
  Anchor,
  Zap,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  Globe,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    step: number;
    color: string;
    badge: string;
  }
> = {
  registered: {
    label: "Registered",
    description: "Your shipment has been registered and is being prepared.",
    icon: Package,
    step: 1,
    color: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  pending: {
    label: "Registered",
    description: "Your shipment has been registered and is being prepared.",
    icon: Package,
    step: 1,
    color: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  picked_up: {
    label: "Picked Up",
    description:
      "Your shipment has been collected and is being prepared for transit.",
    icon: Truck,
    step: 2,
    color: "text-olive-400",
    badge: "bg-olive-500/15 text-olive-400 border-olive-500/25",
  },
  in_transit: {
    label: "En Route",
    description:
      "Your package is in transit — currently travelling by sea or air.",
    icon: Ship,
    step: 2,
    color: "text-olive-400",
    badge: "bg-olive-500/15 text-olive-400 border-olive-500/25",
  },
  on_hold_customs: {
    label: "Customs Hold",
    description: "Your package is being processed by customs authorities.",
    icon: Clock,
    step: 3,
    color: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  customs: {
    label: "Customs",
    description: "Your package is being processed by customs authorities.",
    icon: Clock,
    step: 3,
    color: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  arrived_at_port: {
    label: "Arrived at Port",
    description:
      "Your package has arrived at the destination airport or seaport.",
    icon: Anchor,
    step: 4,
    color: "text-teal-400",
    badge: "bg-teal-500/15 text-teal-400 border-teal-500/25",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    description:
      "Your package is with our local courier and will be delivered today.",
    icon: Truck,
    step: 5,
    color: "text-orange-400",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
  delivered: {
    label: "Delivered",
    description: "Your package has been successfully delivered.",
    icon: CheckCircle2,
    step: 6,
    color: "text-green-400",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
  },
  cancelled: {
    label: "Cancelled",
    description: "This shipment has been cancelled.",
    icon: XCircle,
    step: 0,
    color: "text-red-400",
    badge: "bg-red-500/15 text-red-400 border-red-500/25",
  },
};

const PROGRESS_STEPS = [
  { key: "registered", label: "Registered", icon: Package },
  { key: "in_transit", label: "En Route", icon: Ship },
  { key: "on_hold_customs", label: "Customs", icon: Clock },
  { key: "arrived_at_port", label: "At Port", icon: Anchor },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function ProgressBar({
  status,
  justUpdated = false,
}: {
  status: string;
  justUpdated?: boolean;
}) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
      >
        <XCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Shipment Cancelled</p>
          <p className="text-xs text-red-500">
            This shipment has been cancelled and will not be delivered.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <div className="flex items-center justify-between mb-2 min-w-[280px]">
        {PROGRESS_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < currentStep;
          const active = i === currentStep - 1;
          return (
            <div
              key={step.key}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <div className="relative w-full flex items-center">
                {/* Left connector with animated fill */}
                {i > 0 && (
                  <div className="absolute right-1/2 left-0 h-0.5 bg-gray-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-olive-500 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: done || active ? 1 : 0 }}
                      transition={{
                        duration: 0.55,
                        delay: i * 0.12,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    />
                  </div>
                )}

                {/* Step circle */}
                <motion.div
                  className={`relative z-10 mx-auto w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                    done
                      ? "bg-olive-500 border-olive-500 text-gray-900"
                      : active
                        ? "bg-gray-50 border-olive-500 text-olive-500"
                        : "bg-gray-50 border-gray-300 text-gray-500"
                  }`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{
                    scale: justUpdated && active ? [1, 1.25, 1] : 1,
                    opacity: 1,
                  }}
                  transition={
                    justUpdated && active
                      ? { duration: 0.45, ease: "easeOut" }
                      : {
                          duration: 0.4,
                          delay: i * 0.1,
                          type: "spring",
                          stiffness: 260,
                          damping: 22,
                        }
                  }
                >
                  {/* Pulsing ring on active step */}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{ scale: [1, 1.65], opacity: [0.6, 0] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                  {/* Ripple on live update */}
                  {active && justUpdated && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-400"
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  )}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={done ? "check" : step.key}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>

                {/* Right connector with animated fill */}
                {i < PROGRESS_STEPS.length - 1 && (
                  <div className="absolute left-1/2 right-0 h-0.5 bg-gray-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-olive-500 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: done ? 1 : 0 }}
                      transition={{
                        duration: 0.55,
                        delay: i * 0.12,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    />
                  </div>
                )}
              </div>

              <motion.p
                className={`text-xs text-center font-medium ${
                  done || active ? "text-olive-500" : "text-gray-500"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                {step.label}
              </motion.p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadarAnimation({ size = 140 }: { size?: number }) {
  const cx = size / 2;
  const blips = [
    { rx: 0.27, ry: -0.18, color: "#34d399", delay: "0s" },
    { rx: -0.32, ry: 0.28, color: "#38bdf8", delay: "0.6s" },
    { rx: 0.12, ry: 0.38, color: "#34d399", delay: "1.1s" },
    { rx: 0.38, ry: 0.15, color: "#a78bfa", delay: "1.7s" },
  ];
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at center, #0c1a3a 0%, #060e20 100%)",
        animation: "outerGlow 3s ease-in-out infinite",
        border: "1px solid rgba(56,189,248,0.25)",
      }}
    >
      {/* Crosshair lines */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "8%",
          right: "8%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(56,189,248,0.15) 30%, rgba(56,189,248,0.15) 70%, transparent)",
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "8%",
          bottom: "8%",
          width: 1,
          background:
            "linear-gradient(180deg, transparent, rgba(56,189,248,0.15) 30%, rgba(56,189,248,0.15) 70%, transparent)",
          transform: "translateX(-50%)",
        }}
      />

      {/* Concentric rings */}
      {[1, 0.72, 0.48, 0.26].map((scale, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid rgba(56,189,248,${0.08 + i * 0.07})`,
            transform: `scale(${scale})`,
            animation:
              i === 0 ? "ringPulse 3s ease-in-out infinite" : undefined,
          }}
        />
      ))}

      {/* Sweep — wide luminous tail */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 260deg, rgba(56,189,248,0.04) 290deg, rgba(56,189,248,0.22) 348deg, rgba(56,189,248,0.55) 360deg)",
          animation: "radarSpin 2.8s linear infinite",
          willChange: "transform",
        }}
      />
      {/* Sweep leading-edge bright line */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, transparent 358deg, rgba(100,220,255,0.9) 360deg)",
          animation: "radarSpin 2.8s linear infinite",
          willChange: "transform",
          filter: "blur(0.5px)",
        }}
      />

      {/* Center dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: Math.max(6, size * 0.055),
          height: Math.max(6, size * 0.055),
          borderRadius: "50%",
          background: "#38bdf8",
          boxShadow:
            "0 0 0 2px rgba(56,189,248,0.25), 0 0 16px 4px rgba(56,189,248,0.6)",
        }}
      />

      {/* Blips */}
      {blips.map(({ rx, ry, color, delay }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: cx + rx * cx - 3,
            top: cx + ry * cx - 3,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px 2px ${color}`,
            animation: `blipPulse ${1.8 + i * 0.5}s ${delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function TrackingLoadingSkeleton() {
  const DATA_ROWS = [
    "ORIGIN NODE",
    "DEST NODE",
    "CARRIER ID",
    "ETA CALC",
    "PKG MASS",
    "CUSTOMS",
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#0a0f1e 0%,#0d1b35 100%)",
        border: "1px solid #1e3a6e",
      }}
      aria-label="Scanning shipment"
    >
      {/* Header bar */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #1e3a6e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#38bdf8",
              boxShadow: "0 0 8px #38bdf8",
              animation: "blink 1.2s infinite",
            }}
          />
          <span
            style={{
              color: "#38bdf8",
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            SHIPRION LOGISTICS NETWORK
          </span>
        </div>
        <span
          style={{
            color: "#1e40af",
            fontFamily: "monospace",
            fontSize: 10,
            animation: "blink 0.8s infinite",
          }}
        >
          ● SCANNING
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Left — radar + scan */}
        <div
          style={{
            padding: "28px 24px",
            borderRight: "1px solid #1e3a6e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <RadarAnimation size={140} />

          {/* Scan bar */}
          <div
            style={{
              width: "100%",
              position: "relative",
              height: 6,
              background: "#0f2040",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ x: ["-100%", "110%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,#38bdf8,transparent)",
                borderRadius: 3,
              }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#38bdf8",
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.18em",
                marginBottom: 4,
                animation: "blink 1.5s infinite",
              }}
            >
              QUERYING NODE NETWORK
            </div>
            <div
              style={{ color: "#1e3a8a", fontFamily: "monospace", fontSize: 9 }}
            >
              SHP-XXXXXXXXXX
            </div>
          </div>
        </div>

        {/* Right — data stream */}
        <div
          style={{
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {DATA_ROWS.map((label, i) => (
            <div
              key={label}
              style={{
                animation: `dataFlow 0.4s ${i * 0.12}s both`,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  color: "#1e40af",
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  height: 7,
                  background: "#0f2040",
                  borderRadius: 3,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <motion.div
                  animate={{
                    scaleX: [0, (55 + i * 7) / 100, (45 + i * 9) / 100],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.15,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: "100%",
                    transformOrigin: "left center",
                    background: i % 2 === 0 ? "#1d4ed8" : "#0369a1",
                    borderRadius: 3,
                    willChange: "transform",
                  }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              background: "#0f2040",
              borderRadius: 8,
              border: "1px solid #1e3a6e",
            }}
          >
            <div
              style={{
                color: "#38bdf8",
                fontFamily: "monospace",
                fontSize: 9,
                lineHeight: 1.8,
              }}
            >
              {"> INIT CARRIER HANDSHAKE..."}
              <br />
              {"> RESOLVING WAYPOINTS..."}
              <br />
              <span
                style={{ animation: "blink 0.8s infinite", display: "inline" }}
              >
                {"> _"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: "10px 20px",
          borderTop: "1px solid #1e3a6e",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {["SECURE", "ENCRYPTED", "LIVE"].map((tag) => (
          <span
            key={tag}
            style={{
              color: "#1e40af",
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.12em",
              border: "1px solid #1e3a6e",
              padding: "2px 6px",
              borderRadius: 3,
            }}
          >
            {tag}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 5,
                background: i <= 3 ? "#1d4ed8" : "#0f2040",
                borderRadius: 2,
                animation: i <= 3 ? `blink ${0.7 + i * 0.3}s infinite` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackingInput({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [, setLocation] = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = value.trim();
    if (q.length >= 8 && q !== initial) {
      debounceRef.current = setTimeout(() => {
        setLocation(`/track/${encodeURIComponent(q.toUpperCase())}`);
      }, 800);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, initial, setLocation]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!trimmed) return;
    setLocation(`/track/${encodeURIComponent(trimmed.toUpperCase())}`);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter tracking number, e.g. AB12345678"
            className="pl-9 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-olive-500/50"
            data-testid="input-tracking-search"
          />
        </div>
        <Button type="submit" data-testid="button-search-tracking">
          Track
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>
    </div>
  );
}

/* ─── FAQ accordion ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-gray-900 hover:text-olive-400 transition-colors gap-4"
      >
        {q}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ─── Idle content shown when no tracking number entered ─── */
function TrackIdleContent() {
  const [, setLocation] = useLocation();

  const HOW_IT_WORKS = [
    {
      step: "01",
      icon: Search,
      color: "bg-olive-500/10 text-olive-400",
      title: "Enter Your Tracking Number",
      desc: "Type or paste the tracking number from your confirmation email into the search bar above.",
    },
    {
      step: "02",
      icon: RefreshCw,
      color: "bg-olive-500/10 text-olive-400",
      title: "Instant Database Lookup",
      desc: "Our system queries your shipment record in real time — no login required.",
    },
    {
      step: "03",
      icon: Globe,
      color: "bg-emerald-500/10 text-emerald-400",
      title: "Live Status & Full History",
      desc: "See where your package is right now, every location it has passed through, and the estimated delivery date.",
    },
  ];

  const SHIPMENT_TYPES = [
    {
      icon: Plane,
      label: "Air Freight",
      desc: "120+ countries, 24–96 hr delivery",
      bg: "bg-sky-500/10",
      iconColor: "text-sky-400",
      border: "border-sky-500/20",
    },
    {
      icon: Ship,
      label: "Sea Freight",
      desc: "FCL & LCL, port-to-door covered",
      bg: "bg-teal-500/10",
      iconColor: "text-teal-400",
      border: "border-teal-500/20",
    },
    {
      icon: Truck,
      label: "Road Freight",
      desc: "FTL & LTL across the continent",
      bg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      border: "border-orange-500/20",
    },
    {
      icon: Zap,
      label: "Express",
      desc: "Next-day & same-day delivery",
      bg: "bg-olive-500/10",
      iconColor: "text-olive-400",
      border: "border-olive-500/20",
    },
  ];

  const FAQS = [
    {
      q: "Where do I find my tracking number?",
      a: "Your tracking number (format: SHP-YYYYMMDD-XXXXXX) is included in the booking confirmation email sent immediately after your shipment is created. It also appears in your Shiprion dashboard under 'My Shipments'.",
    },
    {
      q: "How often is tracking information updated?",
      a: "Tracking events are pushed in real time via our logistics network. For air and express shipments, updates typically arrive within minutes of a scan. Sea and road freight updates may be every few hours depending on coverage in that region.",
    },
    {
      q: "Why does my tracking number show 'Not Found'?",
      a: "New shipments can take up to 1 hour to appear in our system after booking. Double-check the format (e.g. SHP-20260426-AB1234) and ensure there are no extra spaces. If the issue persists, contact our support team.",
    },
    {
      q: "Can I track multiple shipments at once?",
      a: "Yes — create or log in to your Shiprion account to view all your active and historical shipments in one dashboard with bulk tracking visibility.",
    },
    {
      q: "Is tracking available for international shipments?",
      a: "Absolutely. Shiprion covers 180+ countries and tracking is available end-to-end for all international air, sea, and road shipments, including customs clearance milestones.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-14">
      {/* Tracking number hint */}
      <FadeIn direction="up">
        <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 bg-olive-500/15 rounded-xl flex items-center justify-center shrink-0">
            <Package className="h-6 w-6 text-olive-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              Where is my tracking number?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Look for it in your{" "}
              <span className="font-semibold text-olive-400">
                booking confirmation email
              </span>{" "}
              — it looks like this:
            </p>
            <code className="inline-block mt-2 text-sm font-mono bg-gray-50 border border-gray-300 text-olive-400 px-3 py-1.5 rounded-lg">
              SHP-20260426-AB1234
            </code>
          </div>
          <Button
            className="bg-olive-500 hover:bg-olive-400 glow-olive shrink-0"
            onClick={() => {
              const el = document.querySelector<HTMLInputElement>(
                '[data-testid="input-tracking-search"]',
              );
              el?.focus();
            }}
          >
            Track Now <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </FadeIn>

      {/* How it works */}
      <FadeIn direction="up" delay={0.05}>
        <div>
          <p className="text-xs font-bold text-olive-400 tracking-widest uppercase mb-2">
            Simple & Instant
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">
            How tracking works
          </h2>
          <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, color, title, desc }) => (
              <StaggerItem key={step}>
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-6 h-full"
                >
                  <span className="text-3xl font-extrabold text-gray-900/[0.06] leading-none block mb-3">
                    {step}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </FadeIn>

      {/* What we track */}
      <FadeIn direction="up" delay={0.05}>
        <div>
          <p className="text-xs font-bold text-olive-400 tracking-widest uppercase mb-2">
            Full Coverage
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            What we track
          </h2>
          <StaggerList className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SHIPMENT_TYPES.map(
              ({ icon: Icon, label, desc, bg, iconColor, border }) => (
                <StaggerItem key={label}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -3 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className={`${bg} border ${border} rounded-2xl p-5 text-center h-full`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3`}
                    >
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 leading-snug">{desc}</p>
                  </motion.div>
                </StaggerItem>
              ),
            )}
          </StaggerList>
        </div>
      </FadeIn>

      {/* Trust strip */}
      <FadeIn direction="up" delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Wifi,
              title: "Real-Time Updates",
              desc: "Pushed the moment a scan happens anywhere in the world.",
            },
            {
              icon: ShieldCheck,
              title: "End-to-End Visibility",
              desc: "From first pickup to final signature — every milestone recorded.",
            },
            {
              icon: Globe,
              title: "180+ Countries",
              desc: "Global coverage across air, sea, and road networks.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 bg-white backdrop-blur-xl rounded-xl border border-gray-200 p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-olive-500/10 border border-olive-500/20 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-olive-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-0.5">
                  {title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* FAQ */}
      <FadeIn direction="up" delay={0.05}>
        <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-6 sm:p-8">
          <p className="text-xs font-bold text-olive-400 tracking-widest uppercase mb-2">
            Got Questions?
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            Frequently asked
          </h2>
          <div className="divide-y divide-white/[0.06]">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Support CTA */}
      <FadeIn direction="up" delay={0.05}>
        <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-8 text-gray-900 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-olive-400 text-xs font-bold tracking-widest uppercase mb-2">
              Still need help?
            </p>
            <h3 className="text-xl font-extrabold mb-2">
              Our support team is 24/7
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Can't find your shipment or need an urgent update? Our logistics
              specialists are available around the clock.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/contact")}
              className="flex items-center justify-center gap-2 bg-olive-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-olive-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Contact Support
            </motion.button>
            <div className="flex gap-2">
              <a
                href="tel:+18001234567"
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-white/20 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
              >
                <Phone className="h-3.5 w-3.5" /> Call Us
              </a>
              <a
                href="mailto:support@shiprion.com"
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-white/20 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

export default function TrackPage() {
  const params = useParams<{ trackingNumber: string }>();
  const trackingNumber = (params.trackingNumber ?? "").toUpperCase().trim();
  const queryClient = useQueryClient();
  const [justUpdated, setJustUpdated] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: shipment,
    isLoading,
    isError,
  } = useTrackShipment(trackingNumber, {
    query: {
      queryKey: getTrackShipmentQueryKey(trackingNumber),
      enabled: !!trackingNumber,
      retry: 1,
      refetchInterval: __SOCKET_IO_ENABLED__ ? false : 15_000,
    },
  });

  const handleShipmentUpdate = useCallback(
    (payload: { trackingNumber: string; status?: string }) => {
      if (payload.trackingNumber !== trackingNumber) return;

      if (payload.status) {
        queryClient.setQueryData(
          getTrackShipmentQueryKey(trackingNumber),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, status: payload.status } : old,
        );
      }

      queryClient.invalidateQueries({
        queryKey: getTrackShipmentQueryKey(trackingNumber),
      });

      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setJustUpdated(true);
      flashTimerRef.current = setTimeout(() => setJustUpdated(false), 2000);
    },
    [trackingNumber, queryClient],
  );

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  useShipmentUpdates(handleShipmentUpdate, trackingNumber);

  const statusConfig = shipment
    ? (STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG["pending"])
    : null;

  return (
    <div className="min-h-[100dvh] bg-white">
      <Helmet>
        <title>
          {shipment
            ? `Track ${shipment.trackingNumber} | Shiprion`
            : trackingNumber
              ? `Tracking ${trackingNumber} | Shiprion`
              : "Track Your Shipment in Real Time | Shiprion"}
        </title>
        <meta
          name="description"
          content={
            shipment
              ? `Live tracking for shipment ${shipment.trackingNumber} — current status: ${shipment.status}. View full delivery timeline and location updates.`
              : "Track your Shiprion shipment in real time. Enter your tracking number to see current status, live location, and full delivery history."
          }
        />
        <meta
          name="robots"
          content={trackingNumber ? "noindex, follow" : "index, follow"}
        />
        {!trackingNumber && (
          <link rel="canonical" href="https://shiprion.com/track" />
        )}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={
            trackingNumber
              ? `Track ${trackingNumber} | Shiprion`
              : "Track Your Shipment | Shiprion"
          }
        />
        <meta
          property="og:description"
          content="Real-time shipment tracking — live status, location updates, and full delivery history."
        />
        <meta property="og:url" content="https://shiprion.com/track" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta name="twitter:title" content="Track Your Shipment | Shiprion" />
        <meta
          name="twitter:description"
          content="Real-time tracking — live status, location, and full delivery history for your Shiprion shipment."
        />
        {!trackingNumber && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              url: "https://shiprion.com/track",
              name: "Track Your Shipment | Shiprion",
              description:
                "Real-time shipment tracking for Shiprion packages worldwide.",
              potentialAction: {
                "@type": "TrackAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://shiprion.com/track/{tracking_number}",
                },
              },
            })}
          </script>
        )}
      </Helmet>
      <style>{`
        @keyframes blink      { 0%,100%{opacity:1}50%{opacity:0.15} }
        @keyframes radarSpin  { 0%{transform:rotate(0deg) translateZ(0)}100%{transform:rotate(360deg) translateZ(0)} }
        @keyframes dataFlow   { 0%{opacity:0;transform:translateY(-4px)}100%{opacity:1;transform:translateY(0)} }
        @keyframes scanLine   { 0%{transform:translateY(0%)}100%{transform:translateY(100%)} }
        @keyframes fadeGrid   { 0%{opacity:0}100%{opacity:1} }
        @keyframes blipPulse  { 0%{transform:scale(1) translateZ(0);opacity:1}50%{transform:scale(1.9) translateZ(0);opacity:0.3}100%{transform:scale(1) translateZ(0);opacity:1} }
        @keyframes ringPulse  { 0%{opacity:0.15}50%{opacity:0.45}100%{opacity:0.15} }
        @keyframes outerGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(56,189,248,0),0 0 18px 2px rgba(56,189,248,0.18)} 50%{box-shadow:0 0 0 4px rgba(56,189,248,0.07),0 0 28px 6px rgba(56,189,248,0.28)} }
      `}</style>
      <PublicNavbar />
      <div className="bg-gray-50 border-b border-gray-200 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-gray-900 hover:bg-blue-800 gap-1"
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <RadarAnimation size={72} />
            <div>
              <h1
                className="text-2xl font-bold text-gray-900"
                data-testid="text-track-title"
              >
                Track Your Package
              </h1>
              <p className="text-blue-300 text-sm">
                Enter your tracking number below
              </p>
            </div>
          </div>

          <TrackingInput initial={trackingNumber} />
        </div>
      </div>

      <div
        className={!trackingNumber ? "" : "max-w-3xl mx-auto px-4 sm:px-6 py-8"}
      >
        {!trackingNumber ? (
          <TrackIdleContent />
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <LoadingDots
                text="Tracking shipment"
                className="text-sm font-medium text-olive-500"
              />
            </div>
            <TrackingLoadingSkeleton />
          </div>
        ) : isError || !shipment ? (
          <div className="animate-fade-in-up" data-testid="tracking-not-found">
            <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/20">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Package Not Found
              </h2>
              <p className="text-gray-500 text-sm mb-3">
                We couldn't locate a shipment with tracking number:
              </p>
              <code className="text-sm font-mono bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-300 mb-6 inline-block">
                {trackingNumber}
              </code>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
                <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Things to check:
                </p>
                <ul className="text-xs text-amber-400/70 space-y-1.5">
                  <li>• Verify the number matches your confirmation email</li>
                  <li>
                    • Use correct format, e.g.{" "}
                    <span className="font-mono">SHP-20260101-AA1111</span>
                  </li>
                  <li>• New shipments may take up to 1 hour to appear</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>(
                      '[data-testid="input-tracking-search"]',
                    );
                    input?.focus();
                    input?.select();
                  }}
                  data-testid="button-retry-tracking"
                >
                  <Search className="h-4 w-4" />
                  Try a Different Number
                </Button>
                <Link href="/">
                  <Button className="bg-olive-500 hover:bg-olive-600 gap-1.5 w-full">
                    <Home className="h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500">
                Still can't find it?{" "}
                <Link
                  href="/contact"
                  className="text-olive-400 hover:underline"
                >
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div
            className="space-y-4 animate-fade-in-up"
            data-testid="tracking-result"
          >
            <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
              {/* Live update notification toast */}
              <AnimatePresence>
                {justUpdated && (
                  <motion.div
                    key="update-toast"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="mb-4"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <div className="flex items-center gap-2 bg-olive-500/10 border border-olive-500/20 text-olive-400 rounded-xl px-4 py-2.5 text-sm font-medium">
                      <motion.span
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex h-2 w-2 rounded-full bg-olive-500 shrink-0"
                      />
                      Real-time update received — status refreshed
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                    Tracking Number
                  </p>
                  <p
                    className="font-mono text-lg font-bold text-gray-900"
                    data-testid="text-tracking-number"
                  >
                    {shipment.trackingNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Status badge — animates out/in on status change */}
                  <AnimatePresence mode="wait">
                    {statusConfig && (
                      <motion.div
                        key={shipment.status}
                        initial={{ opacity: 0, scale: 0.8, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 6 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 26,
                        }}
                      >
                        <Badge
                          className={`text-sm px-3 py-1 border ${statusConfig.badge}`}
                          data-testid="badge-shipment-status"
                        >
                          <statusConfig.icon className="h-3.5 w-3.5 mr-1.5" />
                          {statusConfig.label}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.span
                    animate={justUpdated ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors duration-300 ${
                      justUpdated
                        ? "text-olive-400 bg-olive-500/10 border-olive-500/20"
                        : "text-green-400 bg-green-500/10 border-green-500/20"
                    }`}
                    title="Updates automatically in real time"
                    data-testid="badge-live"
                  >
                    <Wifi
                      className={`h-3 w-3 ${justUpdated ? "animate-pulse" : ""}`}
                    />
                    {justUpdated ? "Updated" : "Live"}
                  </motion.span>
                </div>
              </div>

              <ProgressBar status={shipment.status} justUpdated={justUpdated} />
            </div>

            <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Shipment Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-olive-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-olive-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Route</p>
                    <p className="text-sm font-medium text-gray-900">
                      {shipment.origin}
                    </p>
                    <p className="text-xs text-gray-500">
                      → {shipment.destination}
                    </p>
                  </div>
                </div>

                {shipment.estimatedDelivery && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-olive-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="h-4 w-4 text-olive-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Estimated Delivery
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(
                          shipment.estimatedDelivery,
                        ).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {shipment.weightKg != null && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-olive-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Weight className="h-4 w-4 text-olive-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Weight</p>
                      <p className="text-sm font-medium text-gray-900">
                        {shipment.weightKg} kg
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Route Map
              </h2>
              <ShipmentMap
                events={shipment.events}
                origin={shipment.origin}
                destination={shipment.destination}
              />
            </div>

            <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
                Tracking History
              </h2>

              {shipment.events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No tracking events yet.</p>
                </div>
              ) : (
                <ol className="relative space-y-0">
                  <AnimatePresence initial={false}>
                    {[...shipment.events]
                      .sort(
                        (a, b) =>
                          new Date(b.occurredAt).getTime() -
                          new Date(a.occurredAt).getTime(),
                      )
                      .map((event, i, arr) => (
                        <motion.li
                          key={event.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{
                            duration: 0.38,
                            delay: i * 0.06,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          style={{ willChange: "transform, opacity" }}
                          className="relative pl-8"
                        >
                          <div
                            className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${
                              i < arr.length - 1 ? "bg-gray-100" : "hidden"
                            }`}
                          />
                          <div
                            className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                              i === 0
                                ? "bg-olive-500 border-olive-500"
                                : "bg-gray-50 border-gray-300"
                            }`}
                          >
                            {i === 0 ? (
                              <div className="w-2 h-2 rounded-full bg-white pulse-dot" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            )}
                          </div>

                          <div
                            className={`pb-6 ${i === arr.length - 1 ? "pb-0" : ""}`}
                          >
                            <p
                              className={`text-sm font-semibold ${
                                i === 0 ? "text-gray-900" : "text-gray-500"
                              }`}
                              data-testid={`tracking-event-${event.id}`}
                            >
                              {event.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(event.occurredAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            {i < arr.length - 1 && (
                              <Separator className="mt-4 mb-2" />
                            )}
                          </div>
                        </motion.li>
                      ))}
                  </AnimatePresence>
                </ol>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button className="w-full gap-2 bg-olive-500 hover:bg-olive-600">
                  <Package className="h-4 w-4" />
                  Create a Shipment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
