import asyncio
import socket
import json
from .eventhook import EventHook


class PeerDiscovery:
    """!
    Fires an event when a hosts appears on the network or goes away.
    """
    input_buffer_size = 1024
    broadcast_addr = "255.255.255.255"
    default_port = 1234

    def __init__(self):
        self.sendSocket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sendSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sendSocket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self.recvSocket = None
        self.on_discovery_event = EventHook()
        self._port = self.default_port
        self._local_ip = None

    def set_discovery_port(self, port):
        self._port = port

    def start_browsing(self):
        """!
        Start the discovery on all interfaces. It does listen for UDP broadcast
        packets from the other peers.
        """
        self.recvSocket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.recvSocket.bind(('', self._port))
        self.recvSocket.settimeout(None)
        self.recvSocket.setblocking(False)
        asyncio.get_event_loop().create_task(
            self._listen()
        )

    def start_publishing(self, local_ip, service_port):
        self._local_ip = local_ip
        message = {
            'ip': local_ip,
            'port': service_port
        }
        asyncio.get_event_loop().create_task(
            self._publish(message)
        )

    async def _listen(self):
        while True:
            bytes = await asyncio.get_event_loop().sock_recv(self.recvSocket, self.input_buffer_size)
            parsed_data = json.loads(bytes.decode())
            if 'ip' in parsed_data and 'port' in parsed_data:
                if parsed_data['ip'] != self._local_ip:
                    self.on_discovery_event.fire(parsed_data['ip'], parsed_data['port'])

    async def _publish(self, message):
        while True:
            self.sendSocket.sendto(json.dumps(message).encode(),
                                   (self.broadcast_addr, self._port))
            await asyncio.sleep(1)
