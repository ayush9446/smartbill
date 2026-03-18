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
    ENABLE_GST: bool = False
    GST_PERCENT: float = 0.0
    ENABLE_CGST: bool = False
    CGST_PERCENT: float = 0.0
    ENABLE_SGST: bool = False
    SGST_PERCENT: float = 0.0

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
        "SHOP_NAME": "YOUR SHOP NAME",
        "SHOP_LOCATION": "Enter Shop Location Here",
        "SHOP_PHONE": "+91 00000 00000",
        "GST_NUMBER": "GSTXXXXXXXXXXXX",
        "ENABLE_GST": False,
        "GST_PERCENT": 9.0,
        "ENABLE_CGST": False,
        "CGST_PERCENT": 9.0,
        "ENABLE_SGST": False,
        "SGST_PERCENT": 9.0
    }
    # Create the file with defaults if it doesn't exist
    save_settings(default_settings)
    return default_settings

def set_hidden(path, hide=True):
    """Sets/Unsets the file attribute to HIDDEN on Windows."""
    if os.name == 'nt' and os.path.exists(path):
        try:
            import ctypes
            # FILE_ATTRIBUTE_HIDDEN = 2
            # FILE_ATTRIBUTE_NORMAL = 128
            attr = 2 if hide else 128
            ctypes.windll.kernel32.SetFileAttributesW(path, attr)
        except:
            pass

def save_settings(new_settings: dict):
    # Unhide before writing (some systems block writing to hidden files)
    set_hidden(SETTINGS_FILE, hide=False)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(new_settings, f, indent=4)
    # Hide after writing
    set_hidden(SETTINGS_FILE, hide=True)

def get_public_settings(settings_dict):
    """Return settings without the password for public API responses."""
    return {k: v for k, v in settings_dict.items() if k not in ["SETTINGS_PASSWORD"]}

# Global settings dictionary loaded on startup
settings = load_settings()

