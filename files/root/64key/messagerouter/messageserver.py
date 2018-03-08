import asyncio

import settings
from .wsserver import WSServer
from .logger import Logger, LogLevel


class MessageServer(WSServer):
    """!
    WebSocket server listening on the mesh network. The other peers can
    connect to this server to:
    - get information about the peer (his username, the services available...)
    - send messages encoded as JSON objects
    """

    def __init__(self, ip, port):
        """!
        Constructs a server object which will start to listen on the
        specified IP address and TCP port.

        @param ip The IP address of the interface to listen on
        @param port The TCP port to listen on
        """
        super().__init__(ip, port)
        self.on_new_client += MessageServer.send_self_data

    @staticmethod
    def send_self_data(client):
        """!
        Sends the device information to the client (UID, username,
        and available services).
        @param client The client that must receive the data
        """
        data = {
            'type': 'self-data',
            'uid': settings.uid,
            'name': settings.username,
            'services': settings.services
        }
        asyncio.get_event_loop().create_task(
            client.send(data)
        )
        Logger.log("Sent to peer {}: {}".format(client.remote_ip, data),
                   LogLevel.Debug)
