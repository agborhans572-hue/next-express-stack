import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCubeTexture, useGLTF } from "@react-three/drei";
import {
  DoubleSide,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
} from "three";
import containerPositions from "./content/vessel-containers.json";

const modelUrl = "/cargokite/0bcf139b2d-cargo-new-pipe-dense.3754a503.glb";
const heroModelUrl = "/cargokite/29b92f8cfb-cargo-hero-deform.2eb55ad8.glb";
const environmentFiles = [
  "87f7b2b3c4-px.a7dcba4c.png",
  "53914c2a16-nx.b560611f.png",
  "75a3f0b9ce-py.0cf005c9.png",
  "49d9013f17-ny.ce0e11b8.png",
  "4512fe48e7-pz.c2fa9fc7.png",
  "c4b6ca6e50-nz.24df2ce4.png",
];
const fallbackUrl = "/cargokite/";
type Mode = "hero" | "technology";

function HeroFallback({ riggingOnly = false }: { riggingOnly?: boolean }) {
  return (
    <svg
      className={`ck-hero-kite ${riggingOnly ? "ck-rigging-only" : ""}`}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="ck-kite-desktop">
        <path
          className="ck-kite-canopy"
          d="M432 562Q450 460 500 464Q550 460 568 562L562 538Q547 488 500 482Q453 488 438 538Z"
          fill="#ff471d"
        />
        <path
          d="M500 566L505 680"
          fill="none"
          stroke="#d6dfe3"
          strokeWidth=".6"
          opacity=".35"
        />
        <rect
          x="500"
          y="600"
          width="5"
          height="8"
          fill="#ccd4d6"
          transform="rotate(-20 503 604)"
        />
      </g>
      <g className="ck-kite-mobile">
        <path
          className="ck-kite-canopy"
          d="M373 650Q384 597 480 594Q576 597 587 650L579 643Q565 610 480 608Q395 610 381 643Z"
          fill="#ff471d"
        />
        <path
          d="M480 651L505 681"
          fill="none"
          stroke="#d6dfe3"
          strokeWidth="1"
          opacity=".35"
        />
      </g>
    </svg>
  );
}

function VesselScene({ mode, visible }: { mode: Mode; visible: boolean }) {
  const { scene } = useGLTF(
    mode === "hero" ? heroModelUrl : modelUrl,
    "/cargokite/draco/",
  );
  const environment = useCubeTexture(environmentFiles, { path: "/cargokite/" });
  const group = useRef<Group>(null);
  const { camera, gl, size, invalidate } = useThree();
  const lastPhase = useRef(-1);
  const elapsed = useRef(0);
  useEffect(() => {
    if (mode !== "hero" || !visible) return;
    const timer = setInterval(() => {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) invalidate();
    }, 50);
    return () => clearInterval(timer);
  }, [mode, visible, invalidate]);
  useEffect(() => {
    if (mode !== "technology") return;
    const root = gl.domElement.closest<HTMLElement>(".cargokite-root");
    if (!root) return;
    const observer = new MutationObserver(() => {
      const next = Math.min(
        5,
        Math.floor(Number(root.dataset.vesselProgress ?? 0) * 6),
      );
      if (next !== lastPhase.current) invalidate();
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-vessel-progress"],
    });
    return () => observer.disconnect();
  }, [mode, gl, invalidate]);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const shipMeshes: Mesh[] = [];
    const containers: Mesh[] = [];
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry = object.geometry.clone();
      if (!object.geometry.attributes.normal)
        object.geometry.computeVertexNormals();
      object.material = new MeshStandardMaterial({
        color:
          mode === "hero" && object.name === "kite" ? "#ff471d" : "#2b2c2f",
        envMap: environment,
        envMapIntensity: mode === "hero" ? 4 : 2,
        roughness: mode === "hero" && object.name === "kite" ? 0.35 : 0.7,
        metalness: mode === "hero" && object.name === "kite" ? 0 : 1,
        side: DoubleSide,
        transparent: true,
      });
      if (mode === "hero" && object.name === "chamfer")
        object.scale.setScalar(1.3);
      if (mode === "technology") {
        if (/ship/i.test(object.name)) shipMeshes.push(object);
        if (/container/i.test(object.name)) containers.push(object);
      }
    });
    clone.updateMatrixWorld(true);
    shipMeshes.forEach((mesh) => {
      const edges = new LineSegments(
        new EdgesGeometry(mesh.geometry),
        new LineBasicMaterial({
          color: "#313235",
          transparent: true,
          depthWrite: false,
        }),
      );
      edges.name = `ck-wire-${mesh.name}`;
      edges.matrix.copy(mesh.matrixWorld);
      edges.matrixAutoUpdate = false;
      edges.renderOrder = 1;
      edges.visible = false;
      clone.add(edges);
    });
    containers.forEach((base) => {
      const positions = /large/i.test(base.name)
        ? containerPositions.big
        : containerPositions.small;
      const instances = new InstancedMesh(
        base.geometry.clone(),
        (base.material as MeshStandardMaterial).clone(),
        positions.length,
      );
      instances.name = base.name;
      const transform = new Group();
      transform.rotation.copy(base.rotation);
      transform.scale.copy(base.scale);
      positions.forEach((position, index) => {
        transform.position.set(position.x, position.y, position.z);
        transform.updateMatrix();
        instances.setMatrixAt(index, transform.matrix);
      });
      clone.add(instances);
    });
    return clone;
  }, [scene, mode, environment]);
  useEffect(
    () => () =>
      model.traverse((object) => {
        if (object instanceof Mesh || object instanceof LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      }),
    [model],
  );
  const target = useMemo(() => new Vector3(), []);
  const nextCamera = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    if (!group.current) return;
    const root = gl.domElement.closest<HTMLElement>(".cargokite-root");
    const progress = Number(root?.dataset.vesselProgress ?? 0);
    const mobile = innerWidth < 768;
    if (mode === "hero") {
      if (
        camera instanceof PerspectiveCamera &&
        camera.fov !== 53.13010235415598
      ) {
        camera.fov = 53.13010235415598;
        camera.updateProjectionMatrix();
      }
      camera.position.set(0, 0, size.height);
      camera.lookAt(0, 0, 0);
      const scale =
        innerWidth > 991
          ? Math.min(8, 0.003472 * innerWidth)
          : !mobile
            ? Math.min(3, 0.003472 * innerWidth)
            : Math.min(2.2, 0.006944 * innerHeight);
      model.scale.setScalar(scale);
      model.position.set(0.0045 * size.width, -0.293 * size.height, 0);
      const bone = model.children[0];
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) elapsed.current += delta;
      const time = reduce ? 0 : elapsed.current;
      bone.rotation.set(
        1.57 - (Math.abs(Math.sin(0.8 * time)) * Math.PI) / 36,
        mobile ? (Math.cos(0.4 * time) * Math.PI) / 6 : 0,
        mobile ? (Math.cos(0.4 * time) * Math.PI) / 8 : 0,
      );
      bone.children[0].rotation.x = -1.1400032464213996;
      return;
    }
    const phase = Math.min(5, Math.floor(progress * 6));
    lastPhase.current = phase;
    const views = [
      { eye: [98.2853, 35.6434, -51.4899], at: [73.3979, 44.3087, -1.35464] },
      { eye: [61.1701, 4.58209, 32.9954], at: [21.5902, 6.77748, 0.392013] },
      { eye: [42.094, 24.5614, 32.5401], at: [12.1088, 10.0996, -0.376612] },
      { eye: [-42.9873, 0.581775, 20.0917], at: [-19.5171, 5.83064, 6.94174] },
      {
        eye: [-23.4135, 62.8855, -27.1162],
        at: [mobile ? 0.34757 : -3.34757, 3.08693, mobile ? 0.26576 : 4.26576],
      },
      { eye: [2.14813, 9.41323, -79.4959], at: [2.14813, 9.41323, 0] },
    ];
    const view = views[phase];
    if (
      camera instanceof PerspectiveCamera &&
      camera.fov !== (mobile ? 62.26880414280885 : 32.26880414280885)
    ) {
      camera.fov = mobile ? 62.26880414280885 : 32.26880414280885;
      camera.updateProjectionMatrix();
    }
    nextCamera.set(...(view.eye as [number, number, number]));
    target.set(...(view.at as [number, number, number]));
    camera.position.lerp(nextCamera, Math.min(delta * 3, 1));
    if (camera.position.distanceTo(nextCamera) > 0.05) invalidate();
    camera.lookAt(target);
    group.current.position.set(0, 0, 0);
    model.traverse((object) => {
      if (object instanceof LineSegments) {
        object.visible = phase >= 3;
        return;
      }
      if (!(object instanceof Mesh)) return;
      const material = object.material as MeshStandardMaterial;
      const name = object.name.toLowerCase();
      const cyan = phase === 4 && name.includes("pipete");
      const orange =
        (phase === 0 && name.includes("parachute")) ||
        (phase >= 3 && phase < 5 && name.includes("propeller")) ||
        (phase === 4 && (name.includes("tech") || name.includes("pipeprop")));
      material.color.set(cyan ? "#00e5ff" : orange ? "#ff471d" : "#2b2c2f");
      material.emissive.set(
        cyan
          ? "#00e5ff"
          : phase === 4 && name.includes("pipeprop")
            ? "#ff471d"
            : "#000",
      );
      material.emissiveIntensity = phase === 4 ? 1.2 : 0;
      object.visible = name.includes("container")
        ? phase === 2
        : name.includes("tech") || name.includes("pipete")
          ? phase === 4
          : name.includes("ship")
            ? phase < 3
            : true;
    });
  });
  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Vessel({ mode }: { mode: Mode }) {
  const [lost, setLost] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(mode === "hero");
  useEffect(() => {
    if (!canvas) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((entry) => entry.isIntersecting)),
      {
        root: matchMedia("(max-width: 767px)").matches
          ? document.querySelector(".wrapper")
          : null,
      },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvas]);
  const [supported] = useState(() => {
    try {
      const context = document.createElement("canvas").getContext("webgl2");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(context);
    } catch {
      return false;
    }
  });
  const fallback =
    mode === "hero" ? (
      <HeroFallback />
    ) : (
      <img
        className="ck-vessel-fallback"
        src={`${fallbackUrl}5cbd9b9781-ship-dark.8cbb4bd3.png`}
        alt="CargoKite vessel"
      />
    );
  if (!supported || lost) return fallback;
  return (
    <ModelBoundary fallback={fallback}>
      <Canvas
        flat
        frameloop={visible ? "demand" : "never"}
        camera={
          mode === "hero"
            ? {
                position: [0, 0, 1000],
                fov: 53.13010235415598,
                near: 0.1,
                far: 10000,
              }
            : {
                position: [98.2853, 35.6434, -51.4899],
                fov: 32.26880414280885,
                near: 0.1,
                far: 10000,
              }
        }
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        aria-label={
          mode === "hero" ? "Wind propulsion kite" : "CargoKite vessel model"
        }
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
          setCanvas(gl.domElement);
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => setLost(true),
            { once: true },
          );
        }}
      >
        <Suspense fallback={null}>
          <VesselScene mode={mode} visible={visible} />
        </Suspense>
      </Canvas>
    </ModelBoundary>
  );
}
