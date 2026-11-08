"""Dependency health checks used by ``/health/ready`` and the dashboard."""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

Status = Literal["ok", "error"]


class ComponentHealth(BaseModel):
    status: Status
    latency_ms: float | None = None
    detail: str | None = None


CheckFn = Callable[[], Awaitable[None]]


@dataclass(frozen=True)
class HealthCheck:
    name: str
    fn: CheckFn


def database_check(engine: AsyncEngine) -> HealthCheck:
    async def _check() -> None:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    return HealthCheck("database", _check)


def redis_check(client: Redis) -> HealthCheck:
    async def _check() -> None:
        if not await client.ping():
            raise RuntimeError("PING returned false")

    return HealthCheck("redis", _check)


async def run_check(check: HealthCheck, timeout_s: float) -> ComponentHealth:
    start = time.perf_counter()
    try:
        await asyncio.wait_for(check.fn(), timeout=timeout_s)
    except TimeoutError:
        return ComponentHealth(status="error", detail=f"timed out after {timeout_s}s")
    except Exception as exc:
        # Exception class only: driver messages can contain DSNs/hosts.
        return ComponentHealth(status="error", detail=type(exc).__name__)
    return ComponentHealth(status="ok", latency_ms=round((time.perf_counter() - start) * 1000, 2))


async def run_checks(checks: list[HealthCheck], timeout_s: float) -> dict[str, ComponentHealth]:
    results = await asyncio.gather(*(run_check(c, timeout_s) for c in checks))
    return {c.name: r for c, r in zip(checks, results, strict=True)}
