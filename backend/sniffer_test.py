from scapy.all import sniff, IP, TCP, UDP, conf
import sys

conf.use_pcap = True #forțăm utilizarea pcap pentru a evita problemele de compatibilitate pe MacOS

def process_packet(packet):
    try:        
        if packet.haslayer(IP): #verificam daca avem un pachet IP
            ip_layer = packet.getlayer(IP)
            protocol = "Altele"
            if packet.haslayer(TCP):
                protocol = "TCP"
            elif packet.haslayer(UDP):
                protocol = "UDP"


        print(f"[{protocol}] {ip_layer} -> {ip_layer.dst} | Size : {len(packet)} bytes")
    except Exception as e:
        print(f"Eroare la procesarea pachetului: {e}", file=sys.stderr)

print("EtherVisual Sniffer Test")
print("Interfata en0 (Wi-Fi)") #folosim en0 pentru ca acesta este deobicei interfata Wi-fi pe MacOS
print("Așteptăm pachetele ... (Folosim Ctrl + C pentru a opri)")

try:
    sniff(iface="en0", prn=process_packet, store=0, filter="ip") #folosim 0 pentru a nu pastra nimic in RAM (mai eficient)
except PermissionError :
    print("Eroare : trebuie revăzut sudo-ul")
except Exception as e:
    print(f"Eroare la sniffing: {e}", file=sys.stderr)


