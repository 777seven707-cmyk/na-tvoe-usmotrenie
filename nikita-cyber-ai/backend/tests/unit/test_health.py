from __future__ import annotations

import asyncio

from fastapi.testclient import TestClient

from nikita.api.health import HealthCheck, run_check
from nikita.api.main import create_app
from tests.conftest import make_settings


def test_live(client: TestClient) -> None:
    r = client.get("/api/v1/health/live")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_ready_all_ok(client: TestClient) -> None:
    r = client.get("/api/v1/health/ready")
    body = r.json()
    assert r.status_code == 200
    assert body["status"] == "ok"
    assert set(body["components"]) == {"database", "redis"}
    assert body["anthropic_api_key_configured"] is False


def test_ready_degraded_returns_503_and_hides_error_message() -> None:
    async def ok() -> None:
        return None

    async def broken() -> None:
        raise ConnectionError("postgresql://admin:hunter2@db.internal:5432 refused")

    app = create_app(
        make_settings(), health_checks=[HealthCheck("database", broken), HealthCheck("redis", ok)]
    )
    with TestClient(app) as c:
        r = c.get("/api/v1/health/ready")
    assert r.status_code == 503
    body = r.json()
    assert body["status"] == "degraded"
    assert body["components"]["database"] == {
        "status": "error",
        "latency_ms": None,
        "detail": "ConnectionError",
    }
    assert "hunter2" not in r.text and "db.internal" not in r.text


def test_check_timeout() -> None:
    async def slow() -> None:
        await asyncio.sleep(5)

    result = asyncio.run(run_check(HealthCheck("slow", slow), timeout_s=0.05))
    assert result.status == "error"
    assert result.detail is not None and "timed out" in result.detail


def test_anthropic_key_flag_does_not_leak_value(ok_checks: list[HealthCheck]) -> None:
    app = create_app(make_settings(anthropic_api_key="sk-ant-should-never-appear"), ok_checks)
    with TestClient(app) as c:
        r = c.get("/api/v1/health/ready")
    assert r.json()["anthropic_api_key_configured"] is True
    assert "sk-ant" not in r.text
