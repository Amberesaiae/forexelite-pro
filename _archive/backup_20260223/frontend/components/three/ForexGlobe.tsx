'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';
import RealisticEarth from './RealisticEarth';
import { useTradingSessions } from '@/hooks/use-trading-sessions';
import { useAdaptiveQuality } from '@/hooks/use-adaptive-quality';
import { latLonToVector3 } from './RealisticEarth';

// Major forex cities with lat/lon coordinates
const FOREX_CITIES = [
  { name: 'New York', lat: 40.7128, lon: -74.006, major: true, session: 'New York' },
  { name: 'London', lat: 51.5074, lon: -0.1278, major: true, session: 'London' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, major: true, session: 'Tokyo' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, major: true, session: 'Sydney' },
  { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, major: false, session: 'London' },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, major: false, session: 'Tokyo' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, major: false, session: 'Tokyo' },
  { name: 'Zurich', lat: 47.3769, lon: 8.5417, major: false, session: 'London' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, major: false, session: 'London' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, major: false, session: 'London' },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737, major: false, session: 'Tokyo' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, major: false, session: 'New York' },
];

// Create city positions on Earth sphere
const CITY_POSITIONS = FOREX_CITIES.map((city) => ({
  ...city,
  position: latLonToVector3(city.lat, city.lon, 1.02), // Slightly above surface
}));

// Connection lines between cities (showing forex trading routes)
function GlobeConnections() {
  const { profile } = useAdaptiveQuality();
  
  const lines = useMemo(() => {
    if (profile.tier === 3) return []; // No connections on low-end
    
    const connections: THREE.Vector3[][] = [];
    const majorCities = CITY_POSITIONS.filter(c => c.major);
    
    // Connect major cities to create a network
    for (let i = 0; i < majorCities.length; i++) {
      for (let j = i + 1; j < majorCities.length; j++) {
        const cityA = majorCities[i];
        const cityB = majorCities[j];
        
        // Connect if sessions overlap or are adjacent
        const sessions = ['Sydney', 'Tokyo', 'London', 'New York'];
        const idxA = sessions.indexOf(cityA.session);
        const idxB = sessions.indexOf(cityB.session);
        
        if (Math.abs(idxA - idxB) <= 1 || Math.abs(idxA - idxB) === 3) {
          const start = CITY_POSITIONS.find(c => c.name === cityA.name)!.position;
          const end = CITY_POSITIONS.find(c => c.name === cityB.name)!.position;
          
          // Create an arc above the surface
          const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.3);
          connections.push([start, mid, end]);
        }
      }
    }
    
    return connections;
  }, [profile.tier]);

  // Limit number of lines for performance
  const limitedLines = lines.slice(0, profile.tier === 1 ? 20 : profile.tier === 2 ? 10 : 0);

  return (
    <group>
      {limitedLines.map((line, i) => (
        <Line
          key={i}
          points={line}
          color={i % 2 === 0 ? "#f5a623" : "#8b5cf6"}
          lineWidth={0.5}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  );
}

// City markers with session-based pulsing
function CityMarkers() {
  const { profile } = useAdaptiveQuality();
  const { activeSessions, isSessionActive } = useTradingSessions();

  const markers = useMemo(() => {
    return CITY_POSITIONS.map((city, i) => {
      const isActive = isSessionActive({
        name: city.session,
        color: '',
        startUTC: 0,
        endUTC: 0,
        cities: [],
      });
      
      const activeSession = activeSessions.find(s => s.name === city.session);
      const color = activeSession?.color || (city.major ? '#f5a623' : '#8b5cf6');
      
      return { city, index: i, isActive, color };
    });
  }, [activeSessions, isSessionActive]);

  // Use sprites for better performance on low-end
  if (profile.tier === 3) {
    return (
      <group>
        {markers.slice(0, 8).map(({ city, color }) => (
          <sprite key={city.name} position={city.position} scale={[0.04, 0.04, 1]}>
            <spriteMaterial
              color={color}
              transparent
              opacity={0.8}
            />
          </sprite>
        ))}
      </group>
    );
  }

  // Instance mesh for better performance on mid/high-end
  return (
    <group>
      {markers.map(({ city, color, isActive }) => (
        <group key={city.name} position={city.position}>
          {/* City dot */}
          <mesh>
            <sphereGeometry args={[city.major ? 0.015 : 0.008, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
          
          {/* Pulsing ring for active session */}
          {isActive && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[city.major ? 0.025 : 0.015, city.major ? 0.035 : 0.025, 32]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// Background stars
function Stars() {
  const { profile } = useAdaptiveQuality();
  
  const starCount = profile.tier === 1 ? 3000 : profile.tier === 2 ? 1000 : 300;
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // White/blue stars with slight variation
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness + (Math.random() > 0.8 ? 0.2 : 0);
    }
    
    return { positions, colors };
  }, [starCount]);

  return (
    <Points positions={positions} colors={colors} stride={3}>
      <PointMaterial
        transparent
        size={profile.tier === 1 ? 0.15 : 0.1}
        sizeAttenuation={true}
        depthWrite={false}
        vertexColors
        opacity={0.8}
      />
    </Points>
  );
}

export default function ForexGlobe() {
  const { profile, quality } = useAdaptiveQuality();

  // Determine globe segments based on quality
  const globeSegments = quality.lodBias >= 1 ? 64 : quality.lodBias >= 0.75 ? 32 : 16;

  return (
    <div className="absolute inset-0 -z-20" style={{ height: '100vh', width: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 1.8], fov: 75 }}
        gl={{ 
          antialias: quality.antialias, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, quality.pixelRatio]}
      >
        <color attach="background" args={['transparent']} />
        
        {/* Ambient lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={1.2} 
          color="#ffffff"
        />
        <pointLight position={[-3, 1, -3]} intensity={0.6} color="#d4a84b" />
        <pointLight position={[3, -1, 3]} intensity={0.4} color="#a78bfa" />

        {/* Earth - larger and closer */}
        <RealisticEarth segments={globeSegments} showAtmosphere={true} showClouds={true} />
        
        {/* Overlays */}
        <GlobeConnections />
        <CityMarkers />
        
        {/* Stars background */}
        <Stars />
      </Canvas>
      </div>
    );
}
