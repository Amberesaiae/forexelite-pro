'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useAdaptiveQuality } from '@/hooks/use-adaptive-quality';

// Simple Earth shader - procedural colors (will be replaced with textures)
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  uniform vec3 lightDirection;
  uniform vec3 oceanColor;
  uniform vec3 landColorDay;
  uniform vec3 landColorNight;
  uniform vec3 cityLightColor;
  uniform float time;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simple noise function for procedural continents
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    // Generate procedural continents using noise
    float continent = noise(vUv * 8.0);
    continent += 0.5 * noise(vUv * 16.0);
    continent = smoothstep(0.3, 0.7, continent);

    // City lights (small bright spots in night)
    float cityLights = smoothstep(0.9, 1.0, noise(vUv * 50.0 + time * 0.1));
    cityLights *= 0.3;

    // Light direction (sun)
    vec3 normal = normalize(vNormal);
    float lightDot = max(dot(normal, lightDirection), 0.0);

    // Day/night mixing
    vec3 dayColor = mix(oceanColor, landColorDay, continent);
    vec3 nightColor = mix(oceanColor * 0.3, landColorNight, continent) + cityLightColor * cityLights;
    
    vec3 surfaceColor = mix(nightColor, dayColor, lightDot);

    // Add specular for oceans
    if (continent < 0.5) {
      vec3 viewDir = normalize(-vPosition);
      vec3 reflectDir = reflect(-lightDirection, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
      surfaceColor += vec3(1.0) * spec * 0.3;
    }

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

// Cloud layer shader
const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragmentShader = `
  uniform float opacity;
  uniform float time;

  varying vec2 vUv;
  varying vec3 vNormal;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    // Animated cloud pattern
    vec2 uv = vUv + vec2(time * 0.001, 0.0);
    float clouds = noise(uv * 6.0);
    clouds += 0.5 * noise(uv * 12.0);
    clouds = smoothstep(0.4, 0.7, clouds);
    
    float alpha = clouds * opacity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

// Atmosphere glow shader
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform vec3 glowColor;
  uniform float intensity;

  void main() {
    float viewAngle = dot(vNormal, normalize(-vPosition));
    float glow = pow(1.0 - viewAngle, 4.0);
    vec3 finalGlow = glowColor * glow * intensity;
    gl_FragColor = vec4(finalGlow, glow * 0.7);
  }
`;

interface RealisticEarthProps {
  segments?: number;
  showAtmosphere?: boolean;
  showClouds?: boolean;
}

function EarthSurface({ segments }: { segments: number }) {
  const { quality } = useAdaptiveQuality();
  const ref = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        lightDirection: { value: new THREE.Vector3(0.5, 0.5, 1.0).normalize() },
        oceanColor: { value: new THREE.Color(0x1e3a5f) }, // Deep blue ocean
        landColorDay: { value: new THREE.Color(0x2d5a27) }, // Green land
        landColorNight: { value: new THREE.Color(0x1a3318) }, // Dark green at night
        cityLightColor: { value: new THREE.Color(0xfff4e0) }, // Warm yellow city lights
        time: { value: 0 },
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
      // Update time uniform for animated city lights
      const mat = ref.current.material as THREE.ShaderMaterial;
      if (mat.uniforms.time) {
        mat.uniforms.time.value = state.clock.elapsedTime;
      }
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CloudLayer({ segments }: { segments: number }) {
  const ref = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        opacity: { value: 0.35 },
        time: { value: 0 },
      },
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.052;
      const mat = ref.current.material as THREE.ShaderMaterial;
      if (mat.uniforms.time) {
        mat.uniforms.time.value = state.clock.elapsedTime;
      }
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.01, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function AtmosphereGlow() {
  const { quality } = useAdaptiveQuality();
  const ref = useRef<THREE.Mesh>(null);

  const segments = quality.lodBias >= 1 ? 64 : quality.lodBias >= 0.75 ? 32 : 16;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x4fc3f7) }, // Light blue atmospheric glow
        intensity: { value: 0.6 },
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.15, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function RealisticEarth({ segments = 64, showAtmosphere = true, showClouds = true }: RealisticEarthProps) {
  const { quality } = useAdaptiveQuality();
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  // LOD: adjust segments based on quality
  const lodSegments = useMemo(() => {
    if (quality.lodBias >= 1) return segments;
    if (quality.lodBias >= 0.75) return Math.floor(segments * 0.5);
    return Math.floor(segments * 0.25);
  }, [quality.lodBias, segments]);

  // Handle texture load errors gracefully
  useEffect(() => {
    const timer = setTimeout(() => {
      // If textures take too long, we'll still show the earth
      setTexturesLoaded(true);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, []);

  return (
    <group>
      {/* Earth surface with custom shader */}
      <EarthSurface segments={lodSegments} />
      
      {/* Cloud layer */}
      {showClouds && <CloudLayer segments={lodSegments} />}
      
      {/* Atmospheric glow */}
      {showAtmosphere && <AtmosphereGlow />}
    </group>
  );
}

// Helper to convert lat/lon to 3D position on sphere
export function latLonToVector3(lat: number, lon: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}
