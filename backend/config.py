from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_max_tokens: int = 1000

    database_url: str

    jwt_secret_key: str = "f90wejv9ewjv90jv903jv093j0d9sjvji1je293hfuihfihsd"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5500", "https://zeroto.matteocola.com"]

    idea_min_length: int = 20
    idea_max_length: int = 1000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()