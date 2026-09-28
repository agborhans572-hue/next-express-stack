import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import {
  Component,
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { MapPin, AlertTriangle } from "lucide-react";

declare const __GOOGLE_MAPS_API_KEY__: string;

interface TrackingEvent {
  id: number;
  location: string;
  description: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  occurredAt: Date | string;
}

interface ShipmentMapProps {
  events: TrackingEvent[];
  origin: string;
  destination: string;
}

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(_err: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const STATUS_COLOR: Record<string, { bg: string; border: string }> = {
  registered: { bg: "#3b82f6", border: "#1d4ed8" },
  pending: { bg: "#94a3b8", border: "#64748b" },
  in_transit: { bg: "#6d7c2b", border: "#4a5520" },
  on_hold_customs: { bg: "#f59e0b", border: "#b45309" },
  arrived_at_port: { bg: "#14b8a6", border: "#0d9488" },
  out_for_delivery: { bg: "#3b82f6", border: "#1d4ed8" },
  delivered: { bg: "#22c55e", border: "#15803d" },
  cancelled: { bg: "#ef4444", border: "#b91c1c" },
};

type GeoEvent = TrackingEvent & { latitude: number; longitude: number };

/* ─── helpers ─── */

function haversineDist(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function interpolatePath(path: { lat: number; lng: number }[], t: number) {
  if (path.length === 1) return path[0];
  const clamped = Math.max(0, Math.min(0.9999, t));
  const total = path.length - 1;
  const seg = Math.min(Math.floor(clamped * total), total - 1);
  const segT = clamped * total - seg;
  const p0 = path[seg];
  const p1 = path[seg + 1];
  return {
    lat: p0.lat + (p1.lat - p0.lat) * segT,
    lng: p0.lng + (p1.lng - p0.lng) * segT,
  };
}

function computeBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/* ─── vehicle icons ─── */

function VehicleIcon({
  type,
  bearing,
}: {
  type: "truck" | "plane" | "ship";
  bearing: number;
}) {
  const glowColor =
    type === "plane" ? "#60a5fa" : type === "ship" ? "#34d399" : "#fb923c";

  const iconPath =
    type === "truck"
      ? "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
      : type === "plane"
        ? "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        : "M20 21H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h.5l2-4h11l2 4H20c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2zM6.5 5l-1.5 3h13l-1.5-3H6.5zM12 18c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z";

  const rotateAdj =
    type === "truck" ? bearing - 90 : type === "plane" ? bearing - 90 : bearing;

  return (
    <div
      style={{
        position: "relative",
        transform: `rotate(${rotateAdj}deg)`,
        filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`,
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* glow ring */}
      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `2px solid ${glowColor}`,
          opacity: 0.5,
          animation: "vehiclePulse 1.4s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <svg viewBox="0 0 24 24" width={22} height={22} fill={glowColor}>
        <path d={iconPath} />
      </svg>
      <style>{`
        @keyframes vehiclePulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── animated vehicle marker ─── */

const ANIM_DURATION_MS = 28000;

function AnimatedVehicleMarker({
  path,
  vehicleType,
}: {
  path: { lat: number; lng: number }[];
  vehicleType: "truck" | "plane" | "ship";
}) {
  const [pos, setPos] = useState(path[0]);
  const [bearing, setBearing] = useState(0);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (path.length < 2) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      progressRef.current = (progressRef.current + dt / ANIM_DURATION_MS) % 1;
      const t = progressRef.current;
      const curr = interpolatePath(path, t);
      const next = interpolatePath(path, Math.min(t + 0.003, 0.9999));
      const b = computeBearing(curr, next);

      setPos(curr);
      setBearing(b);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [path]);

  return (
    <AdvancedMarker position={pos} zIndex={30}>
      <VehicleIcon type={vehicleType} bearing={bearing} />
    </AdvancedMarker>
  );
}

/* ─── pulsing dot for latest event ─── */

function LatestMarkerPulse({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: color,
          opacity: 0.25,
          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
          willChange: "transform, opacity",
        }}
      />
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: color,
          border: "3px solid #fff",
          boxShadow: `0 0 0 2px ${color}`,
        }}
      />
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.25}50%{transform:scale(1.5);opacity:.1}}`}</style>
    </div>
  );
}

/* ─── hover tooltip ─── */

function MarkerTooltip({
  text,
  isLatest,
  color,
  visible,
}: {
  text: string;
  isLatest?: boolean;
  color?: string;
  visible: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 4}px)`,
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        transition: "opacity 0.18s ease, transform 0.18s ease",
        zIndex: 1000,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          color: "#f1f5f9",
          borderRadius: 8,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.30)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {isLatest && color && (
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 6px ${color}`,
              flexShrink: 0,
            }}
          />
        )}
        {text}
      </div>
      {/* Arrow */}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "5px solid #0f172a",
        }}
      />
    </div>
  );
}

/* ─── map inner ─── */

function MapInner({
  geoEvents,
  vehicleType,
}: {
  geoEvents: GeoEvent[];
  vehicleType: "truck" | "plane" | "ship";
}) {
  const latestEvent = geoEvents[geoEvents.length - 1];
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    latestEvent?.id ?? null,
  );
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);

  const lats = geoEvents.map((e) => e.latitude);
  const lngs = geoEvents.map((e) => e.longitude);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  const polylinePath = geoEvents.map((e) => ({
    lat: e.latitude,
    lng: e.longitude,
  }));
  const selectedEvent = geoEvents.find((e) => e.id === selectedEventId);
  const latestColors = latestEvent
    ? (STATUS_COLOR[latestEvent.status] ?? STATUS_COLOR["in_transit"])
    : STATUS_COLOR["in_transit"];

  const routePath = useMemo(
    () => geoEvents.map((e) => ({ lat: e.latitude, lng: e.longitude })),
    [geoEvents],
  );

  function toggleSelected(id: number) {
    setSelectedEventId((prev) => (prev === id ? null : id));
  }

  return (
    <Map
      defaultCenter={{ lat: centerLat, lng: centerLng }}
      defaultZoom={geoEvents.length === 1 ? 8 : 5}
      gestureHandling="cooperative"
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl
      zoomControl
      mapId="DEMO_MAP_ID"
    >
      {/* Route polyline */}
      {geoEvents.length > 1 && (
        <Polyline
          path={polylinePath}
          strokeColor="#3b82f6"
          strokeOpacity={0.55}
          strokeWeight={2.5}
          geodesic
        />
      )}

      {/* Past stop markers with hover tooltip */}
      {geoEvents.slice(0, -1).map((event) => {
        const colors = STATUS_COLOR[event.status] ?? STATUS_COLOR["in_transit"];
        const isHovered = hoveredEventId === event.id;
        const isSelected = selectedEventId === event.id;
        return (
          <AdvancedMarker
            key={event.id}
            position={{ lat: event.latitude, lng: event.longitude }}
            onClick={() => toggleSelected(event.id)}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            >
              <MarkerTooltip
                text={event.location}
                visible={isHovered && !isSelected}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: colors.bg,
                  border: `2.5px solid ${colors.border}`,
                  boxShadow: isHovered
                    ? `0 0 0 5px ${colors.bg}33, 0 2px 8px rgba(0,0,0,0.3)`
                    : "0 1px 4px rgba(0,0,0,0.25)",
                  cursor: "pointer",
                  transition:
                    "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: isHovered
                    ? "scale(1.43) translateZ(0)"
                    : "scale(1) translateZ(0)",
                  willChange: "transform",
                }}
              />
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Latest location pulsing dot with hover tooltip */}
      {latestEvent && (
        <AdvancedMarker
          position={{ lat: latestEvent.latitude, lng: latestEvent.longitude }}
          onClick={() => toggleSelected(latestEvent.id)}
          zIndex={10}
        >
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveredEventId(latestEvent.id)}
            onMouseLeave={() => setHoveredEventId(null)}
          >
            <MarkerTooltip
              text={`Current: ${latestEvent.location}`}
              isLatest
              color={latestColors.bg}
              visible={
                hoveredEventId === latestEvent.id &&
                selectedEventId !== latestEvent.id
              }
            />
            <LatestMarkerPulse color={latestColors.bg} />
          </div>
        </AdvancedMarker>
      )}

      {/* Animated vehicle along route */}
      {routePath.length >= 2 && (
        <AnimatedVehicleMarker path={routePath} vehicleType={vehicleType} />
      )}

      {/* Info window with richer detail */}
      {selectedEvent && (
        <InfoWindow
          position={{
            lat: selectedEvent.latitude,
            lng: selectedEvent.longitude,
          }}
          pixelOffset={[0, selectedEvent.id === latestEvent?.id ? -22 : -14]}
          onCloseClick={() => setSelectedEventId(null)}
        >
          <div
            style={{
              maxWidth: 230,
              padding: "4px 2px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: (
                    STATUS_COLOR[selectedEvent.status] ??
                    STATUS_COLOR["in_transit"]
                  ).bg,
                  boxShadow: `0 0 6px ${(STATUS_COLOR[selectedEvent.status] ?? STATUS_COLOR["in_transit"]).bg}`,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {selectedEvent.id === latestEvent?.id && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      background: latestColors.bg,
                      color: "#fff",
                      borderRadius: 4,
                      padding: "2px 5px",
                      flexShrink: 0,
                    }}
                  >
                    CURRENT
                  </span>
                )}
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    margin: 0,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedEvent.location}
                </p>
              </div>
            </div>

            {/* Description */}
            <p
              style={{
                color: "#374151",
                fontSize: 12,
                margin: "0 0 8px",
                lineHeight: 1.5,
              }}
            >
              {selectedEvent.description}
            </p>

            {/* Status chip + timestamp */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: (
                    STATUS_COLOR[selectedEvent.status] ??
                    STATUS_COLOR["in_transit"]
                  ).border,
                  background: `${(STATUS_COLOR[selectedEvent.status] ?? STATUS_COLOR["in_transit"]).bg}22`,
                  border: `1px solid ${(STATUS_COLOR[selectedEvent.status] ?? STATUS_COLOR["in_transit"]).bg}55`,
                  borderRadius: 5,
                  padding: "2px 7px",
                  textTransform: "capitalize",
                }}
              >
                {selectedEvent.status.replace(/_/g, " ")}
              </span>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  margin: 0,
                  flexShrink: 0,
                }}
              >
                {new Date(selectedEvent.occurredAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}

/* ─── exported component ─── */

export function ShipmentMap({ events, origin, destination }: ShipmentMapProps) {
  const geoEvents = [...events]
    .filter((e) => e.latitude != null && e.longitude != null)
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    ) as GeoEvent[];

  const apiKey = __GOOGLE_MAPS_API_KEY__;

  const vehicleType = useMemo((): "truck" | "plane" | "ship" => {
    if (geoEvents.length < 2) return "truck";
    const first = geoEvents[0];
    const last = geoEvents[geoEvents.length - 1];
    const km = haversineDist(
      { lat: first.latitude, lng: first.longitude },
      { lat: last.latitude, lng: last.longitude },
    );
    if (km > 4000) return "plane";
    if (km > 800) return "ship";
    return "truck";
  }, [geoEvents]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/[0.03] rounded-xl border border-white/[0.08] text-gray-500 text-sm gap-2">
        <MapPin className="h-4 w-4" />
        Map unavailable — API key not configured
      </div>
    );
  }

  if (geoEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/[0.03] rounded-xl border border-white/[0.08] text-gray-500 text-sm gap-2 px-6 text-center">
        <MapPin className="h-5 w-5 opacity-40" />
        <p>Route map not available.</p>
        <p className="text-xs text-gray-600">
          Precise location data is not shown on public tracking pages to protect
          recipient privacy. The tracking timeline below shows the full status
          history.
        </p>
      </div>
    );
  }

  const fallback = (
    <div className="flex flex-col items-center justify-center h-64 bg-amber-500/5 rounded-xl border border-amber-500/20 text-amber-400 text-sm gap-2 px-6 text-center">
      <AlertTriangle className="h-5 w-5" />
      <p className="font-medium">Map could not load</p>
      <p className="text-xs text-amber-500">
        Enable the <strong>Maps JavaScript API</strong> in your Google Cloud
        Console for this API key.
      </p>
    </div>
  );

  return (
    <APIProvider apiKey={apiKey}>
      <MapErrorBoundary fallback={fallback}>
        <div
          className="rounded-xl overflow-hidden border border-white/[0.08] shadow-sm"
          style={{ height: 360 }}
        >
          <MapInner geoEvents={geoEvents} vehicleType={vehicleType} />
        </div>
      </MapErrorBoundary>
      <p className="text-xs text-gray-500 mt-1.5 text-right">
        Route: {origin} → {destination}
      </p>
    </APIProvider>
  );
}
