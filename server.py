#!/usr/bin/env python3
# Dev server with cache disabled so art updates always reach the browser.
import http.server

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

http.server.ThreadingHTTPServer(('', 8130), NoCacheHandler).serve_forever()
