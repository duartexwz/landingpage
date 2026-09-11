"""Entry-point do backend na Vercel (@vercel/python).

Expõe `app` (FastAPI) reaproveitando o código de back/ sem duplicação.
Local/docker continuam usando back/api/app.py diretamente.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'back'))

from api.app import app  # noqa: E402,F401
