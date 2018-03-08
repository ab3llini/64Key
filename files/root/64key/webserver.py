import asyncio
import http.server
import socketserver

import settings


class MyHandler(http.server.SimpleHTTPRequestHandler):

    def translate_path(self, path: str):
        path = settings.web_url_prefix + path
        return super().translate_path(path)


class WebServer:

    def __init__(self, port: int):
        self.httpd = socketserver.TCPServer(("", port), MyHandler)

    def serve(self):
        asyncio.get_event_loop().create_task(
            asyncio.wait([self._start_daemon()])
        )

    async def _start_daemon(self):
        await asyncio.get_event_loop().run_in_executor(None, self.httpd.serve_forever)
