'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// Componenta pentru un pachet individual care "zboară"
function Packet({ data }: { data: any }) {
  const mesh = useRef<THREE.Mesh>(null!);
  
  // Animăm pachetul să se miște de la stânga la dreapta
  useFrame((state, delta) => {
    mesh.current.position.x += delta * 5;
    // Când iese din cadrul vizual, îl putem ascunde/elimina
  });

  return (
    <mesh ref={mesh} position={[-10, Math.random() * 4 - 2, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial 
        color={data.proto === 'TCP' ? '#3b82f6' : '#a855f7'} 
        emissive={data.proto === 'TCP' ? '#3b82f6' : '#a855f7'}
        emissiveIntensity={2}
      />
    </mesh>
  );
}

export default function Home() {
  const [packets, setPackets] = useState<any[]>([]);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws');
    socket.onopen = () => setStatus('connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Adăugăm un ID unic pentru React keys
      setPackets((prev) => [{ ...data, id: Math.random() }, ...prev].slice(0, 20));
    };
    return () => socket.close();
  }, []);

  return (
    <div className="h-screen w-full bg-[#05050a] relative">
      {/* HUD - Interfața deasupra scenei 3D */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-blue-500 tracking-tighter">ETHERVISUAL 3D</h1>
        <p className="text-gray-500 font-mono">Status: {status.toUpperCase()}</p>
      </div>

      {/* Scena 3D */}
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={['#05050a']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text position={[-8, 0, 0]} fontSize={0.5} color="white" font="/font.woff">
            LOCALHOST
          </Text>
          <Text position={[8, 0, 0]} fontSize={0.5} color="white">
            WORLD
          </Text>
        </Float>

        {packets.map((p) => (
          <Packet key={p.id} data={p} />
        ))}

        <OrbitControls />
      </Canvas>

      {/* Mini-tabel jos pentru debug */}
      <div className="absolute bottom-8 right-8 w-64 bg-black/50 border border-white/10 p-4 rounded-lg font-mono text-[10px] overflow-hidden">
        {packets.slice(0, 5).map((p, i) => (
          <div key={i} className="flex justify-between border-b border-white/5 py-1 text-gray-400">
            <span>{p.proto}</span>
            <span className="text-blue-400">{p.size}B</span>
          </div>
        ))}
      </div>
    </div>
  );
}