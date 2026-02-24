'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.12;
      meshRef.current.rotation.y = t * 0.18;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.2;
      innerRef.current.rotation.y = t * -0.15;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group>
        <mesh ref={meshRef} scale={2.2}>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color="#f5a623"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        
        <mesh ref={innerRef} scale={1.4}>
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial color="#ffd700" wireframe transparent opacity={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function OrbitalRing({ 
  radius, 
  speed, 
  color, 
  tiltX = 0, 
  tiltZ = 0 
}: { 
  radius: number; 
  speed: number; 
  color: string; 
  tiltX?: number;
  tiltZ?: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * speed;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * tiltX;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[tiltX, 0, tiltZ]}>
      <torusGeometry args={[radius, 0.015, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

const LOGIN_PARTICLES = 800;
const LOGIN_POSITIONS = new Float32Array(LOGIN_PARTICLES * 3);

for (let i = 0; i < LOGIN_PARTICLES; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 3 + Math.random() * 3;
  
  LOGIN_POSITIONS[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  LOGIN_POSITIONS[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  LOGIN_POSITIONS[i * 3 + 2] = r * Math.cos(phi);
}

function LoginParticles() {
  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <Points ref={ref} positions={LOGIN_POSITIONS} stride={3} frustumCulled={false}>
      <PointMaterial
        size={0.025}
        color="#f5a623"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function EnergyPulse() {
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      pulseRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={pulseRef}>
      <sphereGeometry args={[3.5, 32, 32]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.03} side={THREE.BackSide} />
    </mesh>
  );
}

export default function LoginScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0a0a12']} />
      <fog attach="fog" args={['#0a0a12', 5, 12]} />
      
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 6, 6]} intensity={1} color="#f5a623" />
      <pointLight position={[-6, -6, -6]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 4, 0]} intensity={0.6} color="#ffd700" />
      <pointLight position={[0, -4, 2]} intensity={0.3} color="#06b6d4" />
      
      <AnimatedCore />
      <LoginParticles />
      <EnergyPulse />
      
      <OrbitalRing radius={3.2} speed={0.3} color="#8b5cf6" tiltX={0.2} />
      <OrbitalRing radius={2.6} speed={-0.4} color="#ffd700" tiltZ={0.3} />
      <OrbitalRing radius={4} speed={0.2} color="#f5a623" tiltX={-0.15} />
    </Canvas>
  );
}
