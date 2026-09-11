from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACK = Path(__file__).resolve().parent.parent  # back/
_ROOT = _BACK.parent  # raiz do projeto


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(_ROOT / '.env'), str(_BACK / '.env'), '.env'), extra='ignore'
    )

    APP_NAME: str = 'mayckon.dev API'
    ENV: str = 'dev'
    DATABASE_URL: str = 'postgresql://postgres:postgres@localhost:5432/landingpage'

    JWT_SECRET: str = 'troque-este-segredo-com-32-chars-minimo'
    JWT_ALG: str = 'HS256'
    ACCESS_TOKEN_MINUTES: int = 60
    REFRESH_TOKEN_DAYS: int = 7

    CORS_ORIGINS: str = 'http://localhost:5173,http://localhost:3000'

    SEED_ADMIN_NOME: str = 'Mayckon'
    SEED_ADMIN_EMAIL: str = 'mayckonkennedy877@gmail.com'
    SEED_ADMIN_SENHA: str = 'troque-esta-senha'

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(',') if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
