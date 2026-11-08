import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/audit").title };

export default function Page() {
  return (
    <PlannedPage
      href="/audit"
      capabilities={[
        "Semgrep / Bandit static analysis",
        "Dependency vulnerability audit (OSV)",
        "Secret exposure detection with masked output",
        "Configuration and OWASP-oriented checks",
        "Local training lab targets",
      ]}
    />
  );
}
