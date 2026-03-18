import os
import sys

def get_base_dir():
    """
    Returns the absolute path to the base directory of the application.
    When running as a PyInstaller bundle, this is the temporary folder (_MEIPASS).
    Otherwise, it's the folder where the script is located.
    """
    if getattr(sys, 'frozen', False):
        # PyInstaller bundle path
        return sys._MEIPASS
    # Default developmental path
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_data_dir():
    """
    Returns the path to the persistent data directory (where the DB and settings are stored).
    For a secure production experience, we now store this in the user's Local AppData 
    so it's hidden from the customer and they don't have easy edit permissions.
    """
    if getattr(sys, 'frozen', False):
        # Store data in %LOCALAPPDATA%\SmartBill
        appdata = os.environ.get('LOCALAPPDATA', os.path.expanduser('~'))
        data_path = os.path.join(appdata, "SmartBill")
        if not os.path.exists(data_path):
            os.makedirs(data_path)
        return data_path
    # Default to current directory in development
    return os.getcwd()

# Define core constants
BASE_DIR = get_base_dir()
DATA_DIR = get_data_dir()

# Specific paths
TEMPLATES_DIR = os.path.join(BASE_DIR, "app", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "app", "static")
DB_PATH = os.path.join(DATA_DIR, "smartbill.db")
SETTINGS_PATH = os.path.join(DATA_DIR, "settings.json")
