from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel

from seven import __version__
from seven.api.health import ComponentHealth, run_checks
from seven.core.config import Settings

router = APIRouter(prefix="/health", tags=["health"])


class LiveResponse(BaseModel):
    status: Literal["ok"]
    version: str


class ReadyResponse(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    components: dict[str, ComponentHealth]
    # Configuration facts, not live checks. The key value itself is never returned.
    anthropic_api_key_configured: bool


@router.get("/live", response_model=LiveResponse)
async def live() -> LiveResponse:
    return LiveResponse(status="ok", version=__version__)


@router.get(
    "/ready",
    response_model=ReadyResponse,
    responses={503: {"model": ReadyResponse}},
)
async def ready(request: Request, response: Response) -> ReadyResponse:
    settings: Settings = request.app.state.settings
    components = await run_checks(request.app.state.health_checks, settings.health_check_timeout_s)
    healthy = all(c.status == "ok" for c in components.values())
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadyResponse(
        status="ok" if healthy else "degraded",
        version=__version__,
        components=components,
        anthropic_api_key_configured=settings.anthropic_api_key is not None,
    )
