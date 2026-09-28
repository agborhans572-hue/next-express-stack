import { useRef, useMemo, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

/* ─── WebGL error boundary ─── */
class GlobeErrorBoundary extends Component<
  { children: ReactNode },
  { err: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { err: false };
  }
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    if (this.state.err) return <GlobeFallback />;
    return this.props.children;
  }
}

function GlobeFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ position: "relative", width: 260, height: 260 }}>
        {[240, 180, 120, 60].map((size, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1px solid rgba(56,189,248,${0.08 + i * 0.06})`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              animation: `globeFallbackPulse ${3 + i * 0.6}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "radial-gradient(circle,#1d4ed8,#0c1a3a)",
            boxShadow: "0 0 40px rgba(56,189,248,0.3)",
          }}
        />
        <style>{`@keyframes globeFallbackPulse{0%,100%{opacity:0.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.9;transform:translate(-50%,-50%) scale(1.04)}}`}</style>
      </div>
    </div>
  );
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

const RADIUS = 2;

const HUBS = [
  { lat: 40.71, lng: -74.01 },
  { lat: 51.51, lng: -0.13 },
  { lat: 25.2, lng: 55.27 },
  { lat: 1.35, lng: 103.82 },
  { lat: 31.23, lng: 121.47 },
  { lat: -1.29, lng: 36.82 },
  { lat: -23.55, lng: -46.63 },
  { lat: -33.87, lng: 151.21 },
  { lat: 48.85, lng: 2.35 },
  { lat: 35.68, lng: 139.69 },
  { lat: 19.43, lng: -99.13 },
  { lat: 55.75, lng: 37.62 },
];

const ROUTES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 8],
  [8, 0],
  [4, 9],
  [9, 3],
  [2, 5],
  [5, 1],
  [0, 6],
  [6, 1],
  [7, 3],
  [7, 4],
  [10, 0],
  [10, 6],
  [11, 2],
];

const ARC_POINT_COUNT = 61;

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function arcPoints(
  a: THREE.Vector3,
  b: THREE.Vector3,
  lift: number,
  segs: number,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const mid = a
      .clone()
      .lerp(b, t)
      .normalize()
      .multiplyScalar(RADIUS + lift * Math.sin(Math.PI * t));
    pts.push(mid);
  }
  return pts;
}

function GlobeCore() {
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 48, 48]} />
      <meshPhongMaterial
        color="#0c1a3a"
        emissive="#0d2149"
        emissiveIntensity={0.3}
        shininess={60}
        specular="#1e40af"
      />
    </mesh>
  );
}

function GlobeGrid() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(RADIUS + 0.005, 28, 18);
    return new THREE.WireframeGeometry(g);
  }, []);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#1e3a8a" transparent opacity={0.18} />
    </lineSegments>
  );
}

function HubDots() {
  const hubPositions = useMemo(
    () => HUBS.map((h) => latLngToVec3(h.lat, h.lng, RADIUS + 0.03)),
    [],
  );

  return (
    <>
      {hubPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#60a5fa" />
        </mesh>
      ))}
    </>
  );
}

interface ArcDatum {
  full: THREE.Vector3[];
  posArray: Float32Array;
  posAttr: THREE.BufferAttribute;
  geo: THREE.BufferGeometry;
}

function Arcs() {
  const progress = useRef(0);
  const linesRef = useRef<THREE.Line[]>([]);

  const hubVec = useMemo(
    () => HUBS.map((h) => latLngToVec3(h.lat, h.lng, RADIUS)),
    [],
  );

  const arcData = useMemo<ArcDatum[]>(
    () =>
      ROUTES.map(([a, b]) => {
        const pts = arcPoints(hubVec[a], hubVec[b], 0.55, ARC_POINT_COUNT - 1);
        const curve = new THREE.CatmullRomCurve3(pts);
        const full = curve.getPoints(ARC_POINT_COUNT - 1);

        const posArray = new Float32Array(ARC_POINT_COUNT * 3);
        const posAttr = new THREE.BufferAttribute(posArray, 3);
        posAttr.setUsage(THREE.DynamicDrawUsage);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", posAttr);
        geo.setDrawRange(0, 0);

        return { full, posArray, posAttr, geo };
      }),
    [hubVec],
  );

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * 0.28) % 1;

    linesRef.current.forEach((line, i) => {
      if (!line || !arcData[i]) return;
      const { full, posArray, posAttr, geo } = arcData[i];

      const routeOffset = i / ROUTES.length;
      const localT = (progress.current + routeOffset) % 1;
      const tail = Math.max(0, localT - 0.25);
      const count = Math.floor(localT * full.length);
      const tailC = Math.floor(tail * full.length);

      if (count <= tailC) {
        geo.setDrawRange(0, 0);
        return;
      }

      let writeIdx = 0;
      for (let k = tailC; k <= count && k < full.length; k++) {
        posArray[writeIdx++] = full[k]!.x;
        posArray[writeIdx++] = full[k]!.y;
        posArray[writeIdx++] = full[k]!.z;
      }
      const pointCount = writeIdx / 3;
      posAttr.needsUpdate = true;
      geo.setDrawRange(0, pointCount);
    });
  });

  return (
    <>
      {arcData.map(({ geo }, i) => {
        const R3FLine = "line" as unknown as React.ComponentType<{
          ref: (el: THREE.Line | null) => void;
          geometry: THREE.BufferGeometry;
          children: React.ReactNode;
        }>;
        return (
          <R3FLine
            key={i}
            ref={(el) => {
              if (el) linesRef.current[i] = el;
            }}
            geometry={geo}
          >
            <lineBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.8}
              linewidth={1}
            />
          </R3FLine>
        );
      })}
    </>
  );
}

function GlobeAtmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[RADIUS + 0.12, 28, 28]} />
      <meshBasicMaterial
        color="#1d4ed8"
        transparent
        opacity={0.06}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function AutoRotate({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });
  return <group ref={groupRef}>{children}</group>;
}

export function Globe3D({ className = "" }: { className?: string }) {
  const hasWebGL = typeof window !== "undefined" && isWebGLAvailable();

  if (!hasWebGL) {
    return (
      <div className={className} style={{ width: "100%", height: "100%" }}>
        <GlobeFallback />
      </div>
    );
  }

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <GlobeErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Stars
            radius={90}
            depth={50}
            count={2000}
            factor={3}
            saturation={0}
            fade
            speed={0.6}
          />

          <ambientLight intensity={0.25} />
          <directionalLight
            position={[5, 3, 5]}
            intensity={1.4}
            color="#93c5fd"
          />
          <pointLight position={[-4, -2, -4]} intensity={0.4} color="#1d4ed8" />

          <AutoRotate>
            <GlobeAtmosphere />
            <GlobeCore />
            <GlobeGrid />
            <HubDots />
            <Arcs />
          </AutoRotate>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.4}
            minPolarAngle={Math.PI * 0.25}
            maxPolarAngle={Math.PI * 0.75}
            autoRotate={false}
          />
        </Canvas>
      </GlobeErrorBoundary>
    </div>
  );
}
