import { Construction } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { navItem } from "@/lib/navigation";

/**
 * Honest placeholder for a page whose functionality is scheduled for a later phase.
 * It never shows sample data that could be mistaken for real results.
 */
export function PlannedPage({ href, capabilities }: { href: string; capabilities: string[] }) {
  const item = navItem(href);
  return (
    <>
      <PageHeader title={item.title} description={item.description} />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Construction className="size-4 text-warn" />
            <span className="text-sm font-medium">Not implemented yet</span>
            <Badge tone="warn">Phase {item.phase}</Badge>
          </div>
          <p className="text-sm text-fg-muted">
            This page is part of the navigation skeleton. It performs no analysis and shows no
            data until its phase is delivered. Planned capabilities:
          </p>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {capabilities.map((c) => (
              <li key={c} className="flex gap-2 text-fg-muted">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
                {c}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
