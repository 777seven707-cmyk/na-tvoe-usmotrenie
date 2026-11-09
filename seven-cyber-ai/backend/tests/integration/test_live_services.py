"""Run against real PostgreSQL + Redis. Enabled when SEVEN_TEST_DATABASE_URL is set."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from seven.api.main import create_app
from tests.conftest import TEST_DATABASE_URL, make_settings

BACKEND_DIR = Path(__file__).resolve().parents[2]
pytestmark = pytest.mark.postgres


def _alembic(*args: str) -> None:
    subprocess.run(  # noqa: S603  (fixed argv, test-only)
        [sys.executable, "-m", "alembic", *args],
        cwd=BACKEND_DIR,
        check=True,
        env={"SEVEN_DATABASE_URL": TEST_DATABASE_URL or "", "PATH": ""},
        capture_output=True,
    )


def test_migrations_round_trip() -> None:
    _alembic("upgrade", "head")
    _alembic("downgrade", "base")
    _alembic("upgrade", "head")


def test_ready_against_real_services() -> None:
    app = create_app(make_settings())
    with TestClient(app) as c:
        r = c.get("/api/v1/health/ready")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["components"]["database"]["status"] == "ok"
    assert body["components"]["redis"]["status"] == "ok"
