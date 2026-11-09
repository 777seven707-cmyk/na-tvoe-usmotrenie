"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV, isActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-5 px-3 py-4">
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-surface-2 text-fg"
                        : "text-fg-muted hover:bg-surface-2/60 hover:text-fg",
                    )}
                  >
                    <Icon className={cn("size-4", active ? "text-accent" : "text-fg-subtle")} />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
      <span className="grid size-7 place-items-center rounded-md border border-border-strong bg-surface-2 font-mono text-xs font-semibold text-accent">
        S
      </span>
      <span className="text-sm font-semibold tracking-tight">
        SEVEN <span className="text-fg-muted">CYBER AI</span>
      </span>
    </Link>
  );
}
