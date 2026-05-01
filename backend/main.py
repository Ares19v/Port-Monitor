import threading
import uvicorn
import webview
from server import app
import time

def start_server():
    # Run the FastAPI server in a background thread
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

if __name__ == '__main__':
    # Start server thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait a moment for server to start
    time.sleep(1)
    
    # Open the pywebview window pointing to the local server
    webview.create_window(
        title='Port-Monitor',
        url='http://127.0.0.1:8000',
        width=1000,
        height=700,
        resizable=True,
        text_select=True
    )
    
    # Start the webview loop (blocks until window is closed)
    webview.start()
