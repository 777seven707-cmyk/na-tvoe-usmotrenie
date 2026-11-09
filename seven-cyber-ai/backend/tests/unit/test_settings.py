from __future__ import annotations

import pytest

from tests.conftest import make_settings


def test_production_rejects_default_secret() -> None:
    s = make_settings(environment="production", secret_key="dev-insecure-change-me")
    with pytest.raises(RuntimeError, match="SEVEN_SECRET_KEY"):
        s.validate_for_runtime()


def test_production_accepts_custom_secret() -> None:
    make_settings(environment="production", secret_key="x" * 48).validate_for_runtime()


def test_secrets_not_in_repr() -> None:
    s = make_settings(anthropic_api_key="sk-ant-secret", secret_key="topsecret")
    assert "sk-ant-secret" not in repr(s)
    assert "topsecret" not in repr(s)


def test_production_disables_docs(ok_checks: list) -> None:  # type: ignore[type-arg]
    from fastapi.testclient import TestClient

    from seven.api.main import create_app

    app = create_app(make_settings(environment="production", secret_key="y" * 48), ok_checks)
    with TestClient(app) as c:
        assert c.get("/api/v1/docs").status_code == 404
        assert c.get("/api/v1/openapi.json").status_code == 404
