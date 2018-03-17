import asyncio

from netutils import NetUtils
from .peerdiscovery import *
from .peer import Peer
from .logger import Logger, LogLevel
from .messageserver import MessageServer
from .webuiserver import WebUiServer
import settings


class MessageRouter:
    """!
    The MessageRouter class acts as a bridge between the peers on the mesh
    network and the web user interface that is running on the host computer.
    To do so, it keeps the list of all the peers found by Avahi, and every
    time a JSON message intended to a peer is received by the web interface,
    it is relayed to him (if he is still reachable through the mesh network)
    and vice-versa.
    In a way, it does act like a router of JSON messages between the UI and
    the other devices.
    """

    def __init__(self, mesh_if=settings.mesh_interface,
                 local_if=settings.local_interface):
        """!
        MessageRouter constructor.
        It will automatically start:
        - to publish its presence on the mesh network
        - to discover new peers on the mesh network
        - to accept connections from the host computer and from the mesh network
        - to accept and route messages received from/to a peer

        @param mesh_if The mesh network interface (eg. bat0)
        @param local_if The interface connected with the host computer (
        Ethernet over USB)
        """
        self._mesh_ip = NetUtils.interface_address(mesh_if)
        self._chat_server = MessageServer(self._mesh_ip, settings.mesh_port)
        self._chat_server.on_client_message += self._peer_sent_message

        self._local_ip = NetUtils.interface_address(local_if)
        self._webui_server = WebUiServer(self._local_ip, settings.local_port)
        self._webui_server.on_new_client += self._peer_connected
        self._webui_server.on_client_message += self._message_from_ui

        self._discovery = PeerDiscovery()
        self._discovery.set_discovery_port(settings.discovery_mesh_port)
        self._discovery.on_discovery_event += self._on_discovery_event
        self._discovery.start_browsing()
        self._discovery.start_publishing(self._mesh_ip, settings.mesh_port)

        self._peers = PeersConnectionsManager()
        self._peers.on_peers_list_updated += self._peer_connected
        Logger.new_message += self._log_message

    def _on_discovery_event(self, ip, port):
        self._peers.add_connection_to(ip, port)

    def _peer_connected(self, peer=None):
        self._webui_server.send_peers_list(self._peers.peers_list)

    def _peer_sent_message(self, peer, message):
        try:
            if message['type'] == 'service-data-out':
                message['type'] = 'service-data-in'
                self._webui_server.send_to_all(message)
        except KeyError:
            Logger.log(
                "Received an invalid message from peer at {}:{}, message: {}"
                    .format(
                    peer.remote_ip,
                    peer.remote_port,
                    message
                ), LogLevel.Warning)

    def _message_from_ui(self, connection, message):
        try:
            if message['type'] == 'service-data-out':
                message['from'] = settings.uid
                self._peers.send_to_uid(message, message['to'])
                Logger.log(
                    "Received a message from web client at {}:{}, message: {}"
                        .format(
                        connection.remote_ip,
                        connection.remote_port,
                        message
                    ), LogLevel.Debug)
        except KeyError:
            Logger.log(
                "Received an invalid message from web client at {}:{}, message: {}"
                    .format(
                    connection.remote_ip,
                    connection.remote_port,
                    message
                ), LogLevel.Warning)

    def _log_message(self, msg, level):
        level_str = None
        if level == LogLevel.Info:
            level_str = 'info'
        elif level == LogLevel.Debug:
            level_str = 'info'
        elif level == LogLevel.Warning:
            level_str = 'warning'
        elif level == LogLevel.Fatal:
            level_str = 'danger'

        self._webui_server.send_to_all({
            'type': 'log',
            'data': {
                'text': msg,
                'level': level_str
            }
        })


class PeersConnectionsManager:
    """!
    Manages the list of connections with the peers. Provides methods to
    connect to a new peer and check when it disconnects, and to send a
    message to a specific peer identified by its UID.
    """

    def __init__(self):
        self._connections = set()
        ## Event fired when the list of peers has been edited
        self.on_peers_list_updated = EventHook()

    def add_connection_to(self, ip, port):
        """!
        Try to establish a connection with the peer on the specified IP and
        port number.

        @param ip The ip of the peer
        @param port The TCP port
        """
        already_connected = False
        for c in self._connections:
            if c.remote_ip == ip and c.remote_port == port:
                already_connected = True

        if not already_connected:
            Logger.log("Found peer at {}:{}".format(ip, port), LogLevel.Debug)
            c = Peer()
            c.on_failed += self._peer_connection_error
            c.on_disconnect += self._peer_disconnection
            c.on_ready += self._peer_ready
            self._connections.add(c)
            asyncio.get_event_loop().create_task(
                c.connect_to(ip, port)
            )

    def remove_connections(self, ip, port):
        """!
        Try to close the connection with the peer and remove him from the
        list of active peers.

        @param ip The ip of the peer
        @param port The TCP port
        """
        Logger.log("Disconnecting from peer at {}:{}"
                   .format(ip, port), LogLevel.Debug)
        modified = False
        for c in self._connections:
            if c.remote_ip == ip and c.remote_port == port:
                c.disconnect()
                self._connections.remove(c)
                modified = True
        if modified:
            self.on_peers_list_updated.fire()

    def send_to_uid(self, message, uid):
        """!
        Sends a message to the peer identified by this UID.

        @param message The message to deliver
        @param uid The UID of the peer
        """
        Logger.log("Sending a message to all peers: {}".format(message),
                   LogLevel.Debug)
        found = False
        for c in self._connections:
            if c.uid == uid:
                asyncio.get_event_loop().create_task(
                    c.send(message)
                )
                found = True
        return found

    def _peer_disconnection(self, connection, e):
        Logger.log("Peer disconnected {}".format(e), LogLevel.Debug)
        self._connections.remove(connection)
        self.on_peers_list_updated.fire()

    def _peer_connection_error(self, connection, exception):
        Logger.log("Peer connection error {}".format(exception),
                   LogLevel.Warning)
        self._connections.remove(connection)

    def _peer_ready(self, peer):
        Logger.log("Peer {} is ready ({}:{}) ".format(
            peer.username,
            peer.remote_ip,
            peer.remote_port
        ), LogLevel.Debug)
        self.on_peers_list_updated.fire()

    @property
    def peers_list(self):
        peers = dict()
        for c in self._connections:
            if c.is_ready:
                peers[c.uid] = {
                    'name': c.username,
                    'services': c.services
                }
        return peers
