import uvicorn
import webbrowser
import threading
import time
import os
import sys
import logging
import socket
from multiprocessing import freeze_support

# Configure logging
if getattr(sys, 'frozen', False):
    data_dir = os.path.dirname(sys.executable)
    log_path = os.path.join(data_dir, "smartbill_log.txt")
    logging.basicConfig(
        filename=log_path,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    # Redirect stdout/stderr to help log the exact error shown in the console
    sys.stdout = open(os.path.join(data_dir, "smartbill_stdout.txt"), "a")
    sys.stderr = open(os.path.join(data_dir, "smartbill_stderr.txt"), "a")

def check_if_running(port):
    """
    Connect to the port. If it succeeds, the server is definitely active.
    """
    for host in ['127.0.0.1', 'localhost']:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            if s.connect_ex((host, port)) == 0:
                return True
    return False

def open_browser(immediate=True):
    """Open the browser."""
    if not immediate:
        time.sleep(2)
        
    url = 'http://127.0.0.1:8000'
    try:
        logging.info(f"Opening browser to {url} (immediate={immediate})")
        webbrowser.open(url)
    except Exception as e:
        logging.error(f"Failed to open browser: {e}")

if __name__ == "__main__":
    freeze_support()
    
    # 1. First-pass check: Is port 8000 already alive?
    if check_if_running(8000):
        logging.info("Instance already detected via network check. Opening browser and exiting launcher.")
        open_browser(immediate=True)
        sys.exit(0)

    # 2. Setup path for application imports
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, base_path)

    # 3. Custom uvicorn logging config
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stderr",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO"},
        },
    }

    try:
        from app.main import app
        
        logging.info("Starting fresh SmartBill server on 0.0.0.0:8000...")
        # Start browser thread with a slightly longer delay to be safe
        threading.Thread(target=open_browser, args=(False,), daemon=True).start()
        
        # We use 0.0.0.0 so QR code generation / mobile access works on local network
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000, 
            log_config=log_config,
            log_level="info"
        )
    except Exception as e:
        error_str = str(e)
        logging.error(f"Captured error in run block: {error_str}")
        
        # Catch common bind errors (Window Error 10048)
        if "10048" in error_str or "address already in use" in error_str.lower():
            logging.info("Handled bind conflict inside try block. Assumed server up. Opening browser.")
            open_browser(immediate=True)
            sys.exit(0)
             
        # Log full traceback for non-bind fatal errors
        if getattr(sys, 'frozen', False):
            with open(os.path.join(os.path.dirname(sys.executable), "crash_report.txt"), "w") as f:
                import traceback
                f.write(traceback.format_exc())
        sys.exit(1)
