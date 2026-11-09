import {
  Activity,
  AppWindow,
  Bug,
  Code2,
  FileText,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Network,
  Plug,
  Settings,
  ShieldCheck,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type Phase = 2 | 3 | 4 | 5 | 6 | 7;

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Phase in which the page becomes functional. */
  phase: Phase;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Projects, jobs, findings and system health at a glance.",
        phase: 2,
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderKanban,
        description: "Research projects, their targets and authorized scope.",
        phase: 2,
      },
      {
        title: "Research Workspace",
        href: "/workspace",
        icon: Activity,
        description:
          "Give Claude a goal, review the plan, approve steps and follow execution live.",
        phase: 4,
      },
    ],
  },
  {
    label: "Inspectors",
    items: [
      {
        title: "Web Inspector",
        href: "/inspect/web",
        icon: Globe,
        description: "HTTP, headers, cookies, TLS and technology fingerprinting of in-scope sites.",
        phase: 5,
      },
      {
        title: "API Inspector",
        href: "/inspect/api",
        icon: Plug,
        description: "OpenAPI / Swagger import, endpoint inventory and auth configuration review.",
        phase: 5,
      },
      {
        title: "Android Inspector",
        href: "/inspect/android",
        icon: Smartphone,
        description: "APK metadata, manifest, permissions, components and static analysis.",
        phase: 5,
      },
      {
        title: "Windows Inspector",
        href: "/inspect/windows",
        icon: AppWindow,
        description: "PE headers, imports, signatures and version metadata.",
        phase: 5,
      },
      {
        title: "Network Analyzer",
        href: "/inspect/network",
        icon: Network,
        description: "PCAP / PCAPNG protocol statistics, DNS, TLS metadata and timelines.",
        phase: 5,
      },
      {
        title: "Code Explorer",
        href: "/inspect/code",
        icon: Code2,
        description: "Repository structure, dependencies and architecture mapping.",
        phase: 5,
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        title: "Security Audit",
        href: "/audit",
        icon: ShieldCheck,
        description: "Static analysis, dependency audit and configuration checks.",
        phase: 6,
      },
      {
        title: "Findings",
        href: "/findings",
        icon: Bug,
        description: "Triage findings with severity, confidence, evidence and verification status.",
        phase: 7,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
        description: "Generate Markdown, HTML and JSON technical reports.",
        phase: 7,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Tools",
        href: "/tools",
        icon: Wrench,
        description: "Registered tools, their risk class, isolation tier and restricted runner.",
        phase: 3,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Account, AI configuration, retention and platform settings.",
        phase: 2,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

export function navItem(href: string): NavItem {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (!item) throw new Error(`Unknown nav href: ${href}`);
  return item;
}

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
