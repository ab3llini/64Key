import json

from .. import settings
import websockets
from .eventhook import EventHook
from .wsconnection import WSConnection


class WebUiClient(WSConnection):
    """!
    Represents the connection with the web page on the host computer.
    """
    def __init__(self, ws):
        super().__init__()
        self.connection = ws
        ## Event fired when a new message has been received from the Web GUI.
        self.on_service_message = EventHook()

    async def loop(self):
        """!
        async method that checks if there are new messages from the remote end
        and fires an event accordingly.
        """

        await self.send({
            'type': 'self-data',
            'uid': settings.uid,
            'name': settings.username,
            'services': settings.services
        })

        while True:
            try:
                message = json.loads(await self.connection.recv())
                self.on_service_message.fire(message)
            except (websockets.exceptions.ConnectionClosed,
                    websockets.exceptions.PayloadTooBig,
                    websockets.exceptions.WebSocketProtocolError,
                    websockets.exceptions.InvalidState) as err:
                self.on_disconnect.fire(self, err)
                break

    async def send(self, data):
        """!
        Sends data to the Web GUI.

        #param data The data to send
        """
        await self.connection.send(json.dumps(data))

    async def disconnect(self):
        """!
        Closes the connection with the GUI.
        """
        await self.connection.close()

