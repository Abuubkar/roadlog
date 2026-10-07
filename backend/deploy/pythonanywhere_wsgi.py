"""WSGI config for PythonAnywhere.

Paste this into the WSGI file linked from the PythonAnywhere "Web" tab
(/var/www/<username>_pythonanywhere_com_wsgi.py) and replace <username>.
Environment variables are read from backend/.env (see .env.example).
"""

import os
import sys

PROJECT_DIR = "/home/<username>/roadlog/backend"

if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
