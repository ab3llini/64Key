from .wsconnection import WSConnection
from .eventhook import EventHook


class Peer(WSConnection):
    """!
    Represents a remote peer on the mesh network.
    """
    def __init__(self, ws=None):
        """!
        Create a new peer with an already established WebSocket connection.
        When the remote peer will send his UID/username/services information,
        those will be available with the getter methods.

        @param ws The WebSocket connection established with the remote peer.
        """
        super().__init__(ws)
        self._username = None
        self._uid = None
        self._services = None
        self.on_message += self._message_received
        ## Event fired when the peer's information has been received (UID,
        # username, and available services).
        self.on_ready = EventHook()

    def _message_received(self, peer, message):
        if 'type' in message and message['type'] == 'self-data':
            self._username = message['name']
            self._uid = message['uid']
            self._services = message['services']
            self.on_ready.fire(self)

    def _disconnected(self, connection, reason):
        self._username = None
        self._uid = None

    @property
    def username(self):
        """!
        Returns the username of the peer

        @returns The username of the peer
        """
        return self._username

    @property
    def uid(self):
        """!
        Returns the uid of the peer

        @returns The uid of the peer
        """
        return self._uid

    @property
    def services(self):
        """!
        Returns the services of the peer

        @returns The services of the peer
        """
        return self._services

    @property
    def is_ready(self):
        """!
        Returns true if the peer has sent the minimum amount of information
        to be able to send messages to him (UID and username).

        @returns True if username and UID are available, False otherwise.
        """
        return (type(self.username) == str) and (type(self.uid) == str)

