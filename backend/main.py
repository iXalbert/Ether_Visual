import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff, IP, TCP, UDP, conf
import threading
import uvicorn
import socket
import requests

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
ip_cache = {}

def get_ip_location(ip):
    try:
        response = requests.get(f"https://ip-api.com/json/{ip}").json() #se folosesste un api gratuit pentur locatie
        if response.get("status") == "success":
            return response["lat"], response["lon"]
    except:
        pass
    return 0,0 #default locatione 

def get_domain(ip):
    if ip in ip_cache:
        return ip_cache[ip]
    try:
        domain_name = socket.gethostbyaddr(ip)[0] #cauta domeniul 
        ip_cache[ip] = domain_name
        return domain_name
    except:
        ip_cache[ip] = ip
        return ip

def packet_callback(packet):
    if packet.haslayer(IP):
        #src_ip = packet[IP].src
        dst_ip = packet[IP].dst

        lat,lon = get_ip_location(dst_ip)

        dst_name = get_domain(dst_ip)

        data = {
            "src": packet[IP].src,
            "dst": dst_name,
            #"dst_name": dst_name,
            "proto": "TCP" if packet.haslayer(TCP) else "UDP" if packet.haslayer(UDP) else "Other",
            "size": len(packet)
        }

        data["lat"] = lat
        data["lon"] = lon
        
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