# EtherVisual 🌐📡

**EtherVisual** este un instrument avansat de monitorizare și vizualizare a traficului de rețea în timp real. Proiectul transformă datele brute de rețea interceptate la nivel de sistem într-o experiență vizuală 3D imersivă, facilitând înțelegerea fluxurilor de date și a protocoalelor de comunicare.

---

## 🚀 Caracteristici principale

* **Live Packet Sniffing:** Interceptarea pachetelor (TCP, UDP, ICMP, DNS) direct de pe interfața de rețea.
* **Arhitectură Decuplată:** Backend performant în Python care comunică prin WebSockets cu frontend-ul.
* **Vizualizare 3D Real-time:** Reprezentarea pachetelor ca entități dinamice folosind Three.js.
* **Analiză de Protocol:** Clasificarea vizuală a traficului în funcție de tipul de date și dimensiunea pachetelor.

---

## 🏗️ Arhitectura Sistemului

Sistemul este compus din două module independente care colaborează pentru a oferi vizualizarea datelor:

1.  **Backend (The Sniffer):**
    * **Limbaj:** Python 3.9+
    * **Core:** Scapy (manipulare pachete la nivel de kernel).
    * **API:** FastAPI & WebSockets pentru streaming de date cu latență minimă.
2.  **Frontend (The Visualizer):**
    * **Framework:** Next.js (React).
    * **Grafică:** Three.js / React Three Fiber pentru randarea scenei 3D.
    * **Stilizare:** Tailwind CSS.



---

## 🛠️ Instalare și Configurare (macOS)

### Cerințe preliminare
* Python 3.9+
* Node.js 18+
* Acces de administrator (Sudo) pentru accesarea interfeței `en0`.

### Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install scapy fastapi uvicorn websockets
# Rularea necesită drepturi de administrator pe macOS
sudo ./venv/bin/python3 main.py
