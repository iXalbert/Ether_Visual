'use client';

import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Wifi } from 'lucide-react';

export default function Home() {
  const [packets, setPackets] = useState<any[]>([]);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    // Folosim 127.0.0.1 pentru stabilitate pe macOS
    const socket = new WebSocket('ws://127.0.0.1:8000/ws');

    socket.onopen = () => setStatus('connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPackets((prev) => [data, ...prev].slice(0, 15));
    };
    socket.onerror = () => setStatus('error');
    socket.onclose = () => setStatus('disconnected');

    return () => socket.close();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-8 font-mono">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-blue-500 flex items-center gap-3">
            <Activity className="w-10 h-10" /> ETHERVISUAL
          </h1>
          <p className="text-gray-500 mt-2">v1.0.0 | Real-time Packet Inspector</p>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
          status === 'connected' ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {status.toUpperCase()}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 bg-gray-900/50 text-xs font-bold text-gray-400">
            <span>PROTOCOL</span>
            <span>SOURCE</span>
            <span>DESTINATION</span>
            <span className="text-right">SIZE</span>
          </div>

          <div className="h-[500px] overflow-y-auto">
            {packets.map((packet, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800/50 items-center hover:bg-blue-500/5 transition-colors">
                <span className="text-[10px] font-bold px-2 py-1 bg-blue-500/20 text-blue-400 rounded w-fit">
                  {packet.proto}
                </span>
                <span className="text-sm truncate">{packet.src}</span>
                <span className="text-sm truncate">{packet.dst}</span>
                <span className="text-sm text-right text-gray-500">{packet.size} B</span>
              </div>
            ))}
            {packets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 italic py-20">
                <Wifi className="w-12 h-12 mb-4 opacity-20" />
                Aștept pachete din rețea...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}