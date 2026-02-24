'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 5000 }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360) * (Math.PI / 180);
      const phi = THREE.MathUtils.randFloatSpread(360) * (Math.PI / 180);
      const radius = 1 + Math.random() * 2;
      
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(theta);
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.07;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8b5cf6"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function FloatingShapes() {
  const shapesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (shapesRef.current) {
      shapesRef.current.children.forEach((child, i) => {
        child.rotation.x = state.clock.elapsedTime * (0.1 + i * 0.02);
        child.rotation.y = state.clock.elapsedTime * (0.15 + i * 0.02);
        child.position.y = Math.sin(state.clock.elapsedTime + i) * 0.2;
      });
    }
  });

  return (
    <group ref={shapesRef}>
      <mesh position={[-2, 1, -3]}>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="#f472b6" wireframe transparent opacity={0.6} />
      </mesh>
      <mesh position={[2.5, -0.5, -2]}>
        <icosahedronGeometry args={[0.35]} />
        <meshStandardMaterial color="#22d3ee" wireframe transparent opacity={0.6} />
      </mesh>
      <mesh position={[1.5, 1.5, -4]}>
        <torusGeometry args={[0.3, 0.1, 16, 32]} />
        <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[20, 20, 20, 20]} />
      <meshBasicMaterial color="#4c1d95" wireframe transparent opacity={0.15} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <fog attach="fog" args={['#0a0a0a', 3, 12]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f472b6" />
        <Particles count={4000} />
        <FloatingShapes />
        <GridFloor />
      </Canvas>
    </div>
  );
}
