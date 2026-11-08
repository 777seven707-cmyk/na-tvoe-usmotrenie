import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/findings").title };

export default function Page() {
  return (
    <PlannedPage
      href="/findings"
      capabilities={[
        "Severity, confidence and CVSS",
        "Verification status: confirmed / potential / hypothesis / unverified",
        "Linked evidence with source locations",
        "Triage workflow and de-duplication",
      ]}
    />
  );
}
