from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from nikita.api.health import HealthCheck
from nikita.api.main import create_app
from nikita.core.config import Settings

TEST_DATABASE_URL = os.environ.get("NIKITA_TEST_DATABASE_URL")
TEST_REDIS_URL = os.environ.get("NIKITA_TEST_REDIS_URL", "redis://localhost:6379/15")


def make_settings(**overrides: object) -> Settings:
    base: dict[str, object] = {
        "environment": "test",
        "database_url": TEST_DATABASE_URL
        or "postgresql+asyncpg://unused:unused@127.0.0.1:1/unused",
        "redis_url": TEST_REDIS_URL,
        "secret_key": "test-secret",
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)  # type: ignore[arg-type]


async def _ok() -> None:
    return None


@pytest.fixture
def ok_checks() -> list[HealthCheck]:
    return [HealthCheck("database", _ok), HealthCheck("redis", _ok)]


@pytest.fixture
def client(ok_checks: list[HealthCheck]) -> Iterator[TestClient]:
    app = create_app(make_settings(), health_checks=ok_checks)
    with TestClient(app) as c:
        yield c


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if TEST_DATABASE_URL:
        return
    skip = pytest.mark.skip(reason="NIKITA_TEST_DATABASE_URL not set")
    for item in items:
        if "postgres" in item.keywords:
            item.add_marker(skip)
