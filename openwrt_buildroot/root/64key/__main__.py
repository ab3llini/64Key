#!/usr/bin/env python3

import asyncio
import settings
from messagerouter import MessageRouter
from webserver import WebServer

if __name__ == '__main__':
    """!
    Launch the web server and the WebSocket message router
    """
    server = WebServer(settings.web_port)
    server.serve()
    router = MessageRouter()
    asyncio.get_event_loop().run_forever()
