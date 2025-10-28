from contextlib import asynccontextmanager
from tortoise import Tortoise
from fastapi import FastAPI

TORTOISE_ORM = {
    "connections": {
        "default": "sqlite://db.sqlite3"
    },
    "apps": {
        "models": {
            "models": ["api.models", "aerich.models"],
            "default_connection": "default",
        }
    },
}


async def init_db():
    """Initialize database connection"""
    await Tortoise.init(
        db_url="sqlite://db.sqlite3",
        modules={"models": ["api.models"]}
    )
    await Tortoise.generate_schemas()


async def close_db():
    """Close database connection"""
    await Tortoise.close_connections()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for database initialization and cleanup"""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()
