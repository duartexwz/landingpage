from __future__ import annotations

import os
import uuid
from http import HTTPStatus
from pathlib import Path

import httpx
from fastapi import HTTPException, UploadFile
from psycopg import Connection

EXTENSOES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
}


def _pasta_upload(base: str) -> Path:
    pasta = Path(base)
    if not pasta.is_absolute():
        pasta = Path(__file__).resolve().parent.parent.parent / base
    pasta.mkdir(parents=True, exist_ok=True)
    return pasta


class UploadServices:
    def __init__(
        self, upload_dir: str = 'uploads', max_mb: int = 5, blob_token: str = ''
    ):
        self.upload_dir = upload_dir
        self.max_mb = max_mb
        self.blob_token = blob_token

    async def salvar(self, _db: Connection, file: UploadFile) -> dict:
        ext = Path(file.filename or '').suffix.lower()
        if ext not in EXTENSOES:
            raise HTTPException(
                detail='Apenas imagens (png, jpg, jpeg, webp, gif)',
                status_code=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            )
        data = await file.read()
        if len(data) > self.max_mb * 1024 * 1024:
            raise HTTPException(
                detail=f'Máximo {self.max_mb}MB',
                status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )
        if not data.startswith(tuple(self._assinaturas(ext))):
            raise HTTPException(
                detail='Arquivo inválido',
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            )
        nome = f'{uuid.uuid4().hex}{ext}'
        if self.blob_token:
            url = await self._enviar_blob(nome, data, EXTENSOES[ext])
        else:
            (_pasta_upload(self.upload_dir) / nome).write_bytes(data)
            url = f'/uploads/{nome}'
        return {
            'url': url,
            'nome_original': file.filename,
            'tamanho_bytes': len(data),
        }

    async def _enviar_blob(self, nome: str, data: bytes, content_type: str) -> str:
        """Vercel Blob (produção — disco serverless é efêmero)."""
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.put(
                f'https://blob.vercel-storage.com/landing/{nome}',
                content=data,
                headers={
                    'Authorization': f'Bearer {self.blob_token}',
                    'Content-Type': content_type,
                    'x-api-version': '7',
                },
            )
        if r.status_code >= 400:
            raise HTTPException(
                detail='Falha no upload (Blob)',
                status_code=HTTPStatus.BAD_GATEWAY,
            )
        return r.json().get('url', '')

    @staticmethod
    def _assinaturas(ext: str) -> list[bytes]:
        return {
            '.png': [b'\x89PNG'],
            '.jpg': [b'\xff\xd8\xff'],
            '.jpeg': [b'\xff\xd8\xff'],
            '.webp': [b'RIFF'],
            '.gif': [b'GIF87a', b'GIF89a'],
        }[ext]


def pasta_upload_publica() -> Path:
    return _pasta_upload(os.getenv('UPLOAD_DIR', 'uploads'))
