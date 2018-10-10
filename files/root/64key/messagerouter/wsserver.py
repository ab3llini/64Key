import asyncio
import websockets
from .wsconnection import WSConnection
from .eventhook import EventHook
from .logger import Logger, LogLevel


class WSServer:
    """!
    Base class for a WebSocket server.
    """
    def __init__(self, ip, port):
        """!
        Constructs a server object which will start to listen on the
        specified IP address and TCP port.

        @param ip The IP address of the interface to listen on
        @param port The TCP port to listen on
        """
        self._clients = set()
        self.on_new_client = EventHook()
        self.on_client_message = EventHook()
        self.on_client_disconnect = EventHook()
        start_server = websockets.serve(self._new_connection, ip, port)
        asyncio.get_event_loop().run_until_complete(start_server)
        Logger.log("{} server started, listening on {}:{}"
                   .format(self.__class__.__name__, ip, port), LogLevel.Info)

    async def _new_connection(self, ws, path):
        client = WSConnection(ws)
        self._clients.add(client)
        client.on_message += lambda c, msg: self._new_client_message(c, msg)
        client.on_disconnect += lambda c, err: self._client_disconnected(c, err)
        self.on_new_client.fire(client)
        await client.loop()

    def _new_client_message(self, client, message):
        self.on_client_message.fire(client, message)

    def _client_disconnected(self, client, error):
        self._clients.remove(client)
        self.on_client_disconnect.fire(client, error)

    def get_clients_list(self):
        """!
        Returns the list of connected clients.
        """
        return self._clients

    def send_to_all(self, message):
        """!
        Sends a message to all the connected clients.
        @param message The message that has to be sent.
        """
        for c in self.get_clients_list():
            asyncio.get_event_loop().create_task(c.send(message))
