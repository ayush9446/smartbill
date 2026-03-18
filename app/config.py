import json
import os
from pydantic import BaseModel
from app.utils.paths import SETTINGS_PATH

SETTINGS_FILE = SETTINGS_PATH

class SettingsModel(BaseModel):
    SHOP_NAME: str
    SHOP_LOCATION: str
    SHOP_PHONE: str
    GST_NUMBER: str

# CRITICAL: This password is now hardcoded inside the EXE for security.
# Customers cannot see this in settings.json.
ADMIN_PASSWORD = "admin123"

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
                # Remove password if it existed in old files
                if "SETTINGS_PASSWORD" in data:
                    del data["SETTINGS_PASSWORD"]
                    save_settings(data)
                return data
        except Exception:
            pass
    
    # Default settings (without password)
    default_settings = {
        "SHOP_NAME": "AKS SUPERMARKET",
        "SHOP_LOCATION": "Ernakulam, Kerala",
        "SHOP_PHONE": "+91 98765 43210",
        "GST_NUMBER": "32AAAAA1234A1Z5"
    }
    # Create the file with defaults if it doesn't exist
    save_settings(default_settings)
    return default_settings

def save_settings(settings_dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings_dict, f, indent=4)

def get_public_settings(settings_dict):
    """Return settings without the password for public API responses."""
    return {k: v for k, v in settings_dict.items() if k not in ["SETTINGS_PASSWORD"]}

# Global settings dictionary loaded on startup
settings = load_settings()

