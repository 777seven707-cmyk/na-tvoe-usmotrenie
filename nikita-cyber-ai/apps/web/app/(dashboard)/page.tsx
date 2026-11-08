import Link from "next/link";

import { SystemHealth } from "@/components/dashboard/system-health";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV } from "@/lib/navigation";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Projects, research jobs and findings will appear here once their phases are delivered. Only live data is shown — no sample figures."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Platform modules</CardTitle>
            <span className="text-xs text-fg-subtle">Current build: Phase 1 — Foundation</span>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {NAV.flatMap((g) => g.items).map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-2"
                    >
                      <Icon className="size-4 shrink-0 text-fg-subtle" />
                      <span className="w-40 shrink-0">{item.title}</span>
                      <span className="hidden min-w-0 flex-1 truncate text-fg-muted md:block">
                        {item.description}
                      </span>
                      <Badge className="ml-auto">Phase {item.phase}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
        <div className="order-first flex flex-col gap-6 xl:order-none">
          <SystemHealth />
        </div>
      </div>
    </>
  );
}
