import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff, IP, TCP, UDP, conf
import threading
import uvicorn

# Configurare macOS pentru Scapy
conf.use_pcap = True
app = FastAPI()

# Permitem accesul de la frontend-ul nostru
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = []
loop = None

def packet_callback(packet):
    if packet.haslayer(IP):
        data = {
            "src": packet[IP].src,
            "dst": packet[IP].dst,
            "proto": "TCP" if packet.haslayer(TCP) else "UDP" if packet.haslayer(UDP) else "Other",
            "size": len(packet)
        }
        if loop:
            for client in clients:
                asyncio.run_coroutine_threadsafe(client.send_json(data), loop)

def start_sniffing():
    # Pe Mac, en0 este de obicei Wi-Fi. Schimbă în 'lo0' pentru trafic local (localhost)
    sniff(iface="en0", prn=packet_callback, store=0, filter="ip")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        pass
    finally:
        clients.remove(websocket)

@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_event_loop()
    threading.Thread(target=start_sniffing, daemon=True).start()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)