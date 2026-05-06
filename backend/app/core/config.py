from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "DocFlow Web Backend"
    debug: bool = False
    database_url: str = Field(alias="DATABASE_URL")
    session_secret: str = Field(alias="SESSION_SECRET")

    postgres_user: str = Field(alias="POSTGRES_USER")
    postgres_password: str = Field(alias="POSTGRES_PASSWORD")
    postgres_db: str = Field(alias="POSTGRES_DB")

    github_client_id: str | None = Field(default=None, alias="GITHUB_CLIENT_ID")
    github_client_secret: str | None = Field(default=None, alias="GITHUB_CLIENT_SECRET")
    github_callback_url: str | None = Field(default=None, alias="GITHUB_CALLBACK_URL")

    api_key: str | None = Field(default=None, alias="API_KEY")
    base_url: str | None = Field(default=None, alias="BASE_URL")
    model: str | None = Field(default=None, alias="MODEL")

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql+asyncpg://"):
            return self.database_url
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
