#!/usr/bin/env python3
"""
Servidor HTTP con cabeceras CORS — EstructuraCalc
Reemplaza `python -m http.server 3001` para permitir que html2canvas
cargue imágenes locales sin errores "tainted canvas".
"""
import http.server
import socketserver

PORT = 3001

class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        pass  # suprimir logs de acceso

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), CORSHandler) as httpd:
    print(f'EstructuraCalc corriendo en http://localhost:{PORT}')
    httpd.serve_forever()
