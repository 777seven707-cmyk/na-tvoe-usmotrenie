import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/tools").title };

export default function Page() {
  return (
    <PlannedPage
      href="/tools"
      capabilities={[
        "Registry of every executable tool",
        "Input / output schemas, timeouts and limits",
        "Risk class and required approvals",
        "Restricted runner with typed parameters — no host shell",
      ]}
    />
  );
}
