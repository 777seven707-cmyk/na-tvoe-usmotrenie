from __future__ import annotations

from fastapi.testclient import TestClient

from nikita.api.middleware import SECURITY_HEADERS


def test_security_headers_present(client: TestClient) -> None:
    r = client.get("/api/v1/health/live")
    for name, value in SECURITY_HEADERS.items():
        assert r.headers[name] == value


def test_request_id_generated(client: TestClient) -> None:
    r = client.get("/api/v1/health/live")
    assert len(r.headers["x-request-id"]) == 32


def test_valid_request_id_echoed(client: TestClient) -> None:
    r = client.get("/api/v1/health/live", headers={"X-Request-ID": "abc-123"})
    assert r.headers["x-request-id"] == "abc-123"


def test_malicious_request_id_replaced(client: TestClient) -> None:
    r = client.get("/api/v1/health/live", headers={"X-Request-ID": "x\r\nSet-Cookie: a=b"})
    assert r.headers["x-request-id"] != "x\r\nSet-Cookie: a=b"
    assert "set-cookie" not in r.headers
