'use client';

import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, PerspectiveCamera, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- UTIL: Conversie Lat/Lon în Vector 3D ---
const lonLattoVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// --- COMPONENTA GLOB ---
function EarthGlobe() {
  const texture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
  return (
    <Sphere args={[5, 64, 64]}>
      <meshStandardMaterial map={texture} />
    </Sphere>
  );
}

// --- COMPONENTA PACHET (ARC) ---
function ArcPacket({ data, onFinish }: { data: any, onFinish: (pos: THREE.Vector3) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const radius = 5;
  
  // Start: București (44.4, 26.1) | End: Din Backend
  const startPos = useMemo(() => lonLattoVector3(44.4, 26.1, radius), []);
  const endPos = useMemo(() => lonLattoVector3(data.lat || 0, data.lon || 0, radius), [data]);
  
  const curve = useMemo(() => {
    const mid = startPos.clone().lerp(endPos, 0.5).normalize().multiplyScalar(radius + 2);
    return new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
  }, [startPos, endPos]);

  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    const next = progress + delta * 0.6;
    if (next >= 1) onFinish(endPos);
    else {
      setProgress(next);
      if (meshRef.current) meshRef.current.position.copy(curve.getPoint(next));
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={data.proto === 'TCP' ? '#00f2ff' : '#bc13fe'} emissive="#ffffff" emissiveIntensity={0.5} />
    </mesh>
  );
}

// --- PAGINA PRINCIPALĂ ---
export default function Home() {
  const [packets, setPackets] = useState<any[]>([]);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws');
    socket.onopen = () => setStatus('connected');
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setPackets(prev => [...prev, { ...data, id: Math.random() }].slice(-15));
    };
    return () => socket.close();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} />
          <OrbitControls autoRotate autoRotateSpeed={0.3} />
          
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} fade />

          <EarthGlobe />

          {packets.map(p => (
            <ArcPacket key={p.id} data={p} onFinish={() => setPackets(prev => prev.filter(item => item.id !== p.id))} />
          ))}
        </Suspense>
      </Canvas>
      
      <div style={{ position: 'absolute', top: 20, left: 20, color: '#3b82f6', fontFamily: 'monospace' }}>
        <h2>ETHERVISUAL GLOBE</h2>
        <p style={{ color: status === 'connected' ? 'lime' : 'red' }}>{status.toUpperCase()}</p>
      </div>
    </div>
  );
}