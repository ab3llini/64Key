import asyncio

import settings
from .wsserver import WSServer


class WebUiServer(WSServer):
    """!
    Accepts connections from the host computer's browser, where the Web GUI
    is running.
    """
    def __init__(self, ip, port):
        """!
        Constructs a server object which will start to listen on the
        specified IP address and TCP port.

        @param ip The IP address of the interface to listen on
        @param port The TCP port to listen on
        """
        super().__init__(ip, port)
        ## Event fired when a new web client connects to the server
        self.on_new_client += self._on_new_connection

    def _on_new_connection(self, ws):
        asyncio.get_event_loop().create_task(
            ws.send({
                'type': 'self-data',
                'uid': settings.uid,
                'name': settings.username,
                'services': settings.services
            })
        )

    def send_peers_list(self, peers_list):
        """!
        Sends the list of available peers to all the web clients connected
        """
        message = {
            'type': 'hosts-list',
            'hosts': peers_list
        }
        self.send_to_all(message)
