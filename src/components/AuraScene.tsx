import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// Generator/MG — warm toroidal "hugging" field
const GeneratorAura = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.15;
    ref.current.rotation.z += delta * 0.08;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref} position={[-3.2, 1.2, -2]}>
        <torusGeometry args={[1.6, 0.55, 48, 100]} />
        <MeshDistortMaterial
          color="#f4a261"
          emissive="#e07020"
          emissiveIntensity={0.6}
          transparent
          opacity={0.55}
          distort={0.35}
          speed={2.5}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
};

// Manifestor — dense, smooth protective shield
const ManifestorAura = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.12;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref} position={[3.5, -0.5, -1.5]}>
        <icosahedronGeometry args={[1.4, 3]} />
        <MeshDistortMaterial
          color="#7eb8da"
          emissive="#3a7abf"
          emissiveIntensity={0.5}
          transparent
          opacity={0.45}
          distort={0.15}
          speed={1.5}
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>
    </Float>
  );
};

// Projector — focused penetrating beam
const ProjectorAura = () => {
  const ref = useRef<THREE.Group>(null!);
  const coneRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    if (coneRef.current) {
      (coneRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={ref} position={[-2, -2, -1]} rotation={[0, 0, 0.4]}>
        <mesh ref={coneRef}>
          <coneGeometry args={[0.15, 3.5, 32]} />
          <meshStandardMaterial
            color="#f0c27a"
            emissive="#e8a030"
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
        {/* Core glow */}
        <mesh position={[0, -1.8, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial
            color="#fff5e0"
            emissive="#f4a261"
            emissiveIntensity={1.2}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Reflector — shimmering multi-faceted sampling bubble
const ReflectorAura = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = t * 0.2;
    ref.current.rotation.y = t * 0.15;
  });
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={ref} position={[2.5, 2, -2.5]}>
        <dodecahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#c4b5fd"
          emissive="#8b5cf6"
          emissiveIntensity={0.4}
          transparent
          opacity={0.4}
          distort={0.25}
          speed={3}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
    </Float>
  );
};

// Ambient particles
const Particles = () => {
  const count = 120;
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 14;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#f4a261" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

const AuraScene = () => (
  <div className="absolute inset-0 z-0">
    <Canvas
      camera={{ position: [0, 0, 7], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-4, 2, 3]} intensity={0.8} color="#f4a261" />
      <pointLight position={[4, -2, 3]} intensity={0.5} color="#7eb8da" />

      <GeneratorAura />
      <ManifestorAura />
      <ProjectorAura />
      <ReflectorAura />
      <Particles />
    </Canvas>
  </div>
);

export default AuraScene;
