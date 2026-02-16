import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff, IP, TCP, UDP, conf
import threading
import json
import uvicorn

#cand se ruleaza ws://localhost:8000/ws, se va deschide o conexiune websocket care va primi datele despre pachetele capturate in timp real

conf.use_pcap = True #forțăm utilizarea pcap pentru a evita problemele de compatibilitate pe MacOS
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = [] #lista de clienti conectati
loop = None #loop-ul asyncio pentru a putea trimite date din thread-ul snifferului

def process_callback(packet):
    if packet.haslayer(IP):
        payload = {

            "src": packet[IP].src,
            "dst": packet[IP].dst,
            "protocol": "TCP" if packet.haslayer(TCP) else "UDP" if packet.haslayer(UDP) else "Altele",
            "size": len(packet)
        }
        if loop:
            for client in clients: #trimitem date la clienti
                asyncio.run_coroutine_threadsafe(
                    client.send_json(payload), loop
                )

def start_sniffer():
    print("Sniffer activat pe en0")
    sniff(iface="en0", prn=process_callback, store=0, filter="ip") #filtrăm doar pachetele IP pentru eficiență

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"Client conectat: ")
    clients.append(websocket) #adaugam clientul la lista
    try:
        while True:
            await websocket.receive_text() #așteptăm mesaje de la client 
    except Exception as e:
        print(f"Eroare la websocket: {e}")
    finally:
        clients.remove(websocket)

@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_event_loop()
    thread = threading.Thread(target=start_sniffer, daemon=True) #pornim snifferul
    thread.start() #ca sa nu blocheze 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)