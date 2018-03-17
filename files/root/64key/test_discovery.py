#!/usr/bin/env python3

import asyncio
from messagerouter.peerdiscovery import PeerDiscovery

if __name__ == '__main__':
    """!
    Launch the web server and the WebSocket message router
    """
    pd = PeerDiscovery()
    pd.start_browsing("192.168.1.2", 1234)
    asyncio.get_event_loop().run_forever()
