export type ComponentStatus = "ok" | "error";

export interface ComponentHealth {
  status: ComponentStatus;
  latency_ms: number | null;
  detail: string | null;
}

export interface ReadyResponse {
  status: "ok" | "degraded";
  version: string;
  components: Record<string, ComponentHealth>;
  anthropic_api_key_configured: boolean;
}

export type HealthResult =
  | { kind: "ok"; data: ReadyResponse }
  | { kind: "unreachable"; reason: string };

function isReadyResponse(value: unknown): value is ReadyResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.status === "ok" || v.status === "degraded") &&
    typeof v.version === "string" &&
    typeof v.components === "object" &&
    v.components !== null &&
    typeof v.anthropic_api_key_configured === "boolean"
  );
}

/** Fetch readiness. A 503 still carries a valid body describing which component failed. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResult> {
  try {
    const res = await fetch("/api/v1/health/ready", { cache: "no-store", signal });
    const body: unknown = await res.json().catch(() => null);
    if (isReadyResponse(body)) return { kind: "ok", data: body };
    return { kind: "unreachable", reason: `Unexpected response (HTTP ${res.status})` };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return { kind: "unreachable", reason: "API server is not reachable" };
  }
}
