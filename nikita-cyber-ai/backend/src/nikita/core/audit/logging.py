"""Structured logging with mandatory secret redaction.

Every log event passes through :func:`redact_secrets` before rendering, so keys such as
``password``, ``api_key`` or ``authorization`` are masked regardless of call site.
"""

from __future__ import annotations

import logging
import re
import sys
from collections.abc import Mapping, MutableMapping
from typing import Any

import structlog

REDACTED = "[REDACTED]"

_SENSITIVE_KEY = re.compile(
    r"(pass(word|wd)?|secret|token|api[_-]?key|authorization|cookie|session|credential|private[_-]?key)",
    re.IGNORECASE,
)


def _redact(value: Any, depth: int = 0) -> Any:
    if depth > 8:
        return value
    if isinstance(value, Mapping):
        return {
            k: (
                REDACTED
                if isinstance(k, str) and _SENSITIVE_KEY.search(k)
                else _redact(v, depth + 1)
            )
            for k, v in value.items()
        }
    if isinstance(value, list | tuple):
        return type(value)(_redact(v, depth + 1) for v in value)
    return value


def redact_secrets(
    _logger: Any, _method: str, event_dict: MutableMapping[str, Any]
) -> MutableMapping[str, Any]:
    for key in list(event_dict.keys()):
        if key == "event":
            continue
        if _SENSITIVE_KEY.search(key):
            event_dict[key] = REDACTED
        else:
            event_dict[key] = _redact(event_dict[key])
    return event_dict


def configure_logging(level: str = "INFO", json: bool = False) -> None:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)
    renderer: Any = (
        structlog.processors.JSONRenderer() if json else structlog.dev.ConsoleRenderer(colors=False)
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            redact_secrets,
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.getLevelName(level)),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)  # type: ignore[no-any-return]
