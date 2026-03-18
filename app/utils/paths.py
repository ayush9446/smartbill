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
    When running as a PyInstaller bundle, this is the directory containing the .exe file.
    Otherwise, it's the current working directory or the project root.
    """
    if getattr(sys, 'frozen', False):
        # Path where the .exe file is located
        return os.path.dirname(sys.executable)
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
