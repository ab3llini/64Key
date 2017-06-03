import websockets
import json
from .eventhook import EventHook
from .logger import Logger, LogLevel


class WSConnection:
    """!
    Base class for a WebSocket connection. Manages to:
    - establish the connection with the remote end
    - seralize/deserialize JSON messages
    - fire events on connection / disconnection / data received / failure
    """

    def __init__(self, ws=None):
        """!
        Constructs a new WSConnection object. If a WebSocket connection (
        from websocket library) isn't given, the connection can be
        established in the future with the WSConnection::connect_to method.

        @param ws Already established WebSocket connection [optional].
        """
        if type(ws) == websockets.server.WebSocketServerProtocol:
            self._connection = ws
        else:
            self._connection = None
        self.on_connect = EventHook()
        self.on_disconnect = EventHook()
        self.on_failed = EventHook()
        self.on_message = EventHook()
        self.on_message_exception = EventHook()

    async def connect_to(self, address, port):
        """!
        Connects to a remote host.

        @param address The IP address of the remote host.
        @param port The TCP port to connect on the remote host.
        """
        Logger.log("Trying to connect to {}:{}"
                   .format(address, port), LogLevel.Debug)
        try:
            async with websockets.connect('ws://'+address+':'+str(port)) as ws:
                self._connection = ws
                self.on_connect.fire(self)
                await self.loop()
        # if we can't establish a connection, we MUST fire the on_failed event
        except Exception as e:
            self.on_failed.fire(self, e)

    def is_connected(self):
        """!
        Returns true if the connection has been established.
        """
        if self._connection is not None:
            return self._connection.open
        else:
            return False

    async def loop(self):
        """!
        Keeps checking if there are new messages available, and if so,
        fires an event.
        """
        if self.is_connected():
            Logger.log("Connection established with {}:{}".format(
                self.remote_ip,
                self.remote_port
            ), LogLevel.Debug)
        while True:
            try:
                message = json.loads(await self._connection.recv())
                self.on_message.fire(self, message)
            except websockets.exceptions.ConnectionClosed as e:
                self.on_disconnect.fire(self, e)
                break
            except Exception as e:
                self.on_message_exception.fire(self, e)

    async def send(self, data):
        """!
        Sends data to the remote host. The data object must be a dict.

        @param data The data to send (as a dict object)
        """
        try:
            await self._connection.send(json.dumps(data))
        except websockets.ConnectionClosed as e:
            Logger.log("Tried to send data to a closed socket: {}".format(e),
                       LogLevel.Warning)

    async def disconnect(self):
        """!
        Disconnects from the remote host.
        """
        await self._connection.close()

    @property
    def remote_ip(self):
        """!
        Returns the IP of the remote host.
        """
        if self.is_connected():
            return self._connection.remote_address[0]
        else:
            return None

    @property
    def remote_port(self):
        """!
        Returns the remote port of the connection.
        """
        if self.is_connected():
            return self._connection.remote_address[1]
        else:
            return None
