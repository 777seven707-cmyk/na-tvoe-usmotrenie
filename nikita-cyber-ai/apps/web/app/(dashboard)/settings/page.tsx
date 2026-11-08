import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/settings").title };

export default function Page() {
  return (
    <PlannedPage
      href="/settings"
      capabilities={[
        "Account and session management",
        "Anthropic model and token budget",
        "Data retention policy",
        "Default autonomy mode",
      ]}
    />
  );
}
