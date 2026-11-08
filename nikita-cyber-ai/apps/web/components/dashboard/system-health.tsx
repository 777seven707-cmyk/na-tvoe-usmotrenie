"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchHealth, type HealthResult } from "@/lib/api/health";
import { cn } from "@/lib/utils";

const POLL_MS = 15_000;

const LABELS: Record<string, string> = { database: "PostgreSQL", redis: "Redis" };

function Dot({ ok }: { ok: boolean | null }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 rounded-full",
        ok === null ? "bg-fg-subtle" : ok ? "bg-ok" : "bg-danger",
      )}
    />
  );
}

export function SystemHealth() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const apply = useCallback((r: HealthResult) => {
    setResult(r);
    setCheckedAt(new Date());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const tick = () =>
      fetchHealth(controller.signal).then(apply, () => {
        /* aborted on unmount */
      });
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [apply]);

  const manualRefresh = async () => {
    setLoading(true);
    apply(await fetchHealth());
    setLoading(false);
  };

  const overall =
    result === null ? null : result.kind === "ok" && result.data.status === "ok";

  return (
    <Card role="region" aria-labelledby="system-health-title">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dot ok={overall} />
          <CardTitle id="system-health-title">System health</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {checkedAt && (
            <span className="font-mono text-[11px] text-fg-subtle" suppressHydrationWarning>
              {checkedAt.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh health"
            onClick={() => void manualRefresh()}
            disabled={loading}
          >
            <RefreshCw className={cn(loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {result === null && <p className="px-4 py-4 text-sm text-fg-muted">Checking…</p>}

        {result?.kind === "unreachable" && (
          <div className="flex items-center justify-between px-4 py-4 text-sm">
            <span className="text-fg-muted">Backend API</span>
            <Badge tone="danger">{result.reason}</Badge>
          </div>
        )}

        {result?.kind === "ok" && (
          <ul className="divide-y divide-border text-sm">
            <li className="flex items-center justify-between px-4 py-3">
              <span className="text-fg-muted">Backend API</span>
              <Badge tone="ok">v{result.data.version}</Badge>
            </li>
            {Object.entries(result.data.components).map(([name, c]) => (
              <li key={name} className="flex items-center justify-between px-4 py-3">
                <span className="text-fg-muted">{LABELS[name] ?? name}</span>
                {c.status === "ok" ? (
                  <Badge tone="ok">ok · {c.latency_ms} ms</Badge>
                ) : (
                  <Badge tone="danger">{c.detail ?? "error"}</Badge>
                )}
              </li>
            ))}
            <li className="flex items-center justify-between px-4 py-3">
              <span className="text-fg-muted">Anthropic API key</span>
              {result.data.anthropic_api_key_configured ? (
                <Badge tone="ok">configured</Badge>
              ) : (
                <Badge tone="warn">not configured</Badge>
              )}
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
