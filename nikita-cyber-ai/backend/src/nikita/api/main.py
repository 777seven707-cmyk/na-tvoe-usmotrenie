"""FastAPI application factory."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from nikita import __version__
from nikita.api.health import HealthCheck, database_check, redis_check
from nikita.api.middleware import RequestContextMiddleware
from nikita.api.routers import health
from nikita.core.audit.logging import configure_logging, get_logger
from nikita.core.config import Settings, get_settings
from nikita.database.session import create_engine, create_session_factory

API_PREFIX = "/api/v1"


def create_app(
    settings: Settings | None = None,
    health_checks: list[HealthCheck] | None = None,
) -> FastAPI:
    """Build the app. ``health_checks`` may be injected by tests to avoid live services."""
    settings = settings or get_settings()
    settings.validate_for_runtime()
    configure_logging(settings.log_level, settings.log_json)
    log = get_logger("nikita.api")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = create_engine(settings.database_url)
        redis = Redis.from_url(settings.redis_url, socket_connect_timeout=2, socket_timeout=2)
        app.state.engine = engine
        app.state.session_factory = create_session_factory(engine)
        app.state.redis = redis
        if health_checks is None:
            app.state.health_checks = [database_check(engine), redis_check(redis)]
        log.info("api.startup", environment=settings.environment, version=__version__)
        try:
            yield
        finally:
            await redis.aclose()
            await engine.dispose()
            log.info("api.shutdown")

    app = FastAPI(
        title="NIKITA CYBER AI API",
        version=__version__,
        lifespan=lifespan,
        docs_url=None if settings.is_production else f"{API_PREFIX}/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else f"{API_PREFIX}/openapi.json",
    )
    app.state.settings = settings
    if health_checks is not None:
        app.state.health_checks = health_checks
    app.add_middleware(RequestContextMiddleware)
    app.include_router(health.router, prefix=API_PREFIX)
    return app


def app_factory() -> FastAPI:  # entry point for `uvicorn --factory`
    return create_app()
