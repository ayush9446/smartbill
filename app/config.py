import json
import os
from pydantic import BaseModel

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "settings.json")

class SettingsModel(BaseModel):
    SHOP_NAME: str
    SHOP_LOCATION: str
    SHOP_PHONE: str
    GST_NUMBER: str

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
                # Ensure SETTINGS_PASSWORD exists (migrate old settings files)
                if "SETTINGS_PASSWORD" not in data:
                    data["SETTINGS_PASSWORD"] = "admin123"
                    save_settings(data)
                return data
        except Exception:
            pass
    
    # Default settings
    default_settings = {
        "SHOP_NAME": "AKS SUPERMARKET",
        "SHOP_LOCATION": "Ernakulam, Kerala",
        "SHOP_PHONE": "+91 98765 43210",
        "GST_NUMBER": "32AAAAA1234A1Z5",
        "SETTINGS_PASSWORD": "admin123"
    }
    # Create the file with defaults if it doesn't exist
    save_settings(default_settings)
    return default_settings

def save_settings(settings_dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings_dict, f, indent=4)

import socket

def get_local_ip():
    """Returns the local IP address of this machine on the network."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # We don't need a real connection, just to see which interface is used
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def get_public_settings(settings_dict):
    """Return settings without the password for public API responses."""
    public = {k: v for k, v in settings_dict.items() if k != "SETTINGS_PASSWORD"}
    public['SERVER_IP'] = get_local_ip()
    return public

# Global settings dictionary loaded on startup
settings = load_settings()

