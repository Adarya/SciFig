#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

# Change to the dist directory
os.chdir('dist')

PORT = 3000
Handler = http.server.SimpleHTTPRequestHandler

print(f"🚀 Starting SciFig AI on http://localhost:{PORT}")
print("📂 Serving from dist/ directory")

try:
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"✅ Server running at http://localhost:{PORT}")
        print("🔗 Open this URL in your browser!")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n🛑 Server stopped")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)