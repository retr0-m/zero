from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine, Base
from config import settings
from logger import get_logger
from routers.auth import router as auth_router
from routers.analyze import router as analyze_router
from routers.ideas import router as ideas_router
from routers.chat import router as chat_router
from db import Base

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting zeroto platform API")
    # create all tables if they don't exist (dev convenience — use alembic in prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database tables ready")
    yield
    log.info("Shutting down")
    await engine.dispose()


app = FastAPI(
    title="zeroto Platform API",
    description="From idea to business plan.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(ideas_router)
app.include_router(chat_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}