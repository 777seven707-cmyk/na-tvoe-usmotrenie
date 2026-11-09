import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/reports").title };

export default function Page() {
  return (
    <PlannedPage
      href="/reports"
      capabilities={[
        "Markdown, HTML and JSON export",
        "Executive summary and technical appendix",
        "Methodology, scope and modules used",
        "Verification status on every finding",
      ]}
    />
  );
}
