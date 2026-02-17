'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- 1. COMPONENTA PACHET (SFRELE) ---
function Packet({ data, onFinish }: { data: any; onFinish: () => void }) {
  const mesh = useRef<THREE.Mesh>(null!);
  // Viteza variabilă ca să nu pară robotizat
  const speed = useMemo(() => Math.random() * 4 + 4, []);
  const yPos = useMemo(() => (Math.random() - 0.5) * 6, []);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.position.x += delta * speed;
      if (mesh.current.position.x > 10) onFinish();
    }
  });

  return (
    <mesh ref={mesh} position={[-10, yPos, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial 
        color={data.proto === 'TCP' ? '#00f2ff' : '#bc13fe'} 
        emissive={data.proto === 'TCP' ? '#00f2ff' : '#bc13fe'}
        emissiveIntensity={2}
      />
    </mesh>
  );
}

// --- 2. PAGINA PRINCIPALĂ ---
export default function Home() {
  const [packets, setPackets] = useState<any[]>([]);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws');
    socket.onopen = () => setStatus('connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPackets((prev) => [...prev, { ...data, id: Math.random() }]);
    };
    socket.onclose = () => setStatus('disconnected');
    return () => socket.close();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#05050a' }}>
      
      {/* UI OVERLAY */}
      <div style={{ position: 'absolute', top: 40, left: 40, zIndex: 10, color: 'white', fontFamily: 'monospace', pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', margin: 0 }}>ETHERVISUAL 3D</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status === 'connected' ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{status.toUpperCase()}</span>
        </div>
      </div>

      {/* CANVAS 3D */}
      <Canvas shadows={false}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <OrbitControls />
        
        {/* Lumini Obligatorii */}
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Marcaje de orientare */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text position={[-10, 0, 0]} fontSize={1} color="#3b82f6">LOCAL</Text>
          <Text position={[10, 0, 0]} fontSize={1} color="#ef4444">WORLD</Text>
        </Float>

        {/* Randare Pachete */}
        {packets.map((p) => (
          <Packet 
            key={p.id} 
            data={p} 
            onFinish={() => setPackets(prev => prev.filter(item => item.id !== p.id))} 
          />
        ))}
      </Canvas>

      {/* FEED TEXT JOS */}
      <div style={{ position: 'absolute', bottom: 40, right: 40, width: '250px', background: 'rgba(0,0,0,0.7)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '10px', fontFamily: 'monospace' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px', color: '#3b82f6' }}>LIVE TRAFFIC</div>
        {packets.slice(-5).reverse().map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.8 }}>
            <span>{p.proto}</span>
            <span style={{ color: '#aaa' }}>{p.size}B</span>
          </div>
        ))}
        {packets.length === 0 && <div style={{ opacity: 0.3 }}>Aștept pachete...</div>}
      </div>
    </div>
  );
}