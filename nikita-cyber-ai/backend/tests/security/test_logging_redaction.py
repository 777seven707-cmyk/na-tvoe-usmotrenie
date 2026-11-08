from __future__ import annotations

from nikita.core.audit.logging import REDACTED, redact_secrets


def test_top_level_sensitive_keys_redacted() -> None:
    event = {
        "event": "x",
        "password": "p",
        "api_key": "k",
        "Authorization": "Bearer t",
        "session_id": "s",
        "path": "/ok",
    }
    out = redact_secrets(None, "info", event)
    assert (
        out["password"] == out["api_key"] == out["Authorization"] == out["session_id"] == REDACTED
    )
    assert out["path"] == "/ok"
    assert out["event"] == "x"


def test_nested_structures_redacted() -> None:
    out = redact_secrets(
        None,
        "info",
        {"event": "e", "headers": {"cookie": "c", "accept": "json"}, "items": [{"token": "t"}]},
    )
    assert out["headers"] == {"cookie": REDACTED, "accept": "json"}
    assert out["items"] == [{"token": REDACTED}]
